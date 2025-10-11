package com.sandwich.SandWich.challenge.service;

import com.sandwich.SandWich.challenge.controller.SubmissionController;
import com.sandwich.SandWich.challenge.domain.*;
import com.sandwich.SandWich.challenge.dto.SubmissionDtos;
import com.sandwich.SandWich.challenge.event.CodeSubmissionCreatedEvent;
import com.sandwich.SandWich.challenge.event.SubmissionCreatedEvent;
import com.sandwich.SandWich.challenge.repository.*;
import com.sandwich.SandWich.auth.CurrentUserProvider;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final ChallengeRepository challengeRepo;
    private final SubmissionRepository submissionRepo;
    private final SubmissionAssetRepository assetRepo;
    private final CodeSubmissionRepository codeRepo;
    private final CurrentUserProvider currentUser;
    private final ApplicationEventPublisher publisher;

    private final LikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final UserRepository userRepo;

    private final SubmissionViewQueryService subViewQuery;
    private final SubmissionViewService subViewService;

    private static final Set<String> ALLOWED_LANG =
            Set.of("java","kotlin","python","node","js","ts","go","rust","cpp","c","ruby","php");

    // === 생성 + 응답 사양 (id, status, createdAt) ===
    @Transactional
    public SubmissionController.CreatedResp createAndReturn(Long challengeId, SubmissionDtos.CreateReq req) {
        var ch = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Challenge not found"));

        Long id;
        SubmissionStatus status;

        if (ch.getType() == ChallengeType.CODE) {
            id = createCode(ch, req);
            status = SubmissionStatus.PENDING;
        } else {
            id = createPortfolio(ch, req);
            status = SubmissionStatus.SUBMITTED;
        }

        var saved = submissionRepo.findById(id).orElseThrow();
        return new SubmissionController.CreatedResp(saved.getId(), status.name(), saved.getCreatedAt());
    }

    // ===== 포트폴리오 제출 =====
    @Transactional
    private Long createPortfolio(Challenge ch, SubmissionDtos.CreateReq req) {
        if (ch.getType() != ChallengeType.PORTFOLIO)
            throw new ResponseStatusException(BAD_REQUEST, "Only PORTFOLIO challenge accepts submissions");

        var now = java.time.OffsetDateTime.now();
        if (!now.isBefore(ch.getEndAt()))
            throw new ResponseStatusException(BAD_REQUEST, "Submission closed");

        Long userId = currentSafeUserId();

        if (submissionRepo.existsByChallenge_IdAndOwnerId(ch.getId(), userId))
            throw new ResponseStatusException(CONFLICT, "Already submitted for this challenge");

        var sub = Submission.builder()
                .challenge(ch)
                .ownerId(userId)
                .title(req.getTitle())
                .desc(req.getDesc())
                .repoUrl(req.getRepoUrl())
                .demoUrl(req.getDemoUrl())
                .coverUrl(req.getCoverUrl())
                .participationType(req.getParticipationType())
                .teamName(req.getTeamName())
                .membersText(req.getMembersText())
                .extraJson("{}")
                .status(SubmissionStatus.SUBMITTED)
                .build();
        sub = submissionRepo.save(sub);

        if (req.getAssets() != null) {
            for (var a : req.getAssets()) {
                assetRepo.save(SubmissionAsset.builder()
                        .submission(sub)
                        .url(a.getUrl())
                        .mime(a.getMime())
                        .build());
            }
        }

        // coverUrl 보강
        if ((sub.getCoverUrl() == null || sub.getCoverUrl().isBlank())
                && req.getAssets() != null && !req.getAssets().isEmpty()) {
            sub.setCoverUrl(req.getAssets().get(0).getUrl());
            submissionRepo.save(sub);
        }

        publisher.publishEvent(new SubmissionCreatedEvent(
                sub.getId(), ch.getId(), userId, sub.getTitle(), sub.getRepoUrl(), sub.getDemoUrl()
        ));

        return sub.getId();
    }

    // ===== 코드 챌린지 제출 =====
    @Transactional
    private Long createCode(Challenge ch, SubmissionDtos.CreateReq req) {
        var now = java.time.OffsetDateTime.now();
        if (!now.isBefore(ch.getEndAt()))
            throw new ResponseStatusException(BAD_REQUEST, "Submission closed");

        if (req.getCode() == null)
            throw new ResponseStatusException(BAD_REQUEST, "code block required");

        var code = req.getCode();
        var lang = code.getLanguage() == null ? "" : code.getLanguage().toLowerCase();
        if (!ALLOWED_LANG.contains(lang))
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported language: " + code.getLanguage());

        Long userId = currentSafeUserId();
        if (submissionRepo.existsByChallenge_IdAndOwnerId(ch.getId(), userId))
            throw new ResponseStatusException(CONFLICT, "Already submitted for this challenge");

        var sub = Submission.builder()
                .challenge(ch)
                .ownerId(userId)
                .title(req.getTitle())
                .desc(req.getDesc())
                .repoUrl(req.getRepoUrl())
                .demoUrl(req.getDemoUrl())
                .coverUrl(req.getCoverUrl())
                .participationType(req.getParticipationType())
                .teamName(req.getTeamName())
                .membersText(req.getMembersText())
                .status(SubmissionStatus.PENDING)
                .build();
        sub = submissionRepo.save(sub);

        var cs = CodeSubmission.builder()
                .submission(sub)
                .language(lang)
                .entrypoint(code.getEntrypoint())
                .commitSha(code.getCommitSha())
                .build();
        codeRepo.save(cs);

        publisher.publishEvent(new SubmissionCreatedEvent(
                sub.getId(), ch.getId(), userId, sub.getTitle(), sub.getRepoUrl(), sub.getDemoUrl()
        ));
        publisher.publishEvent(new CodeSubmissionCreatedEvent(sub.getId()));

        return sub.getId();
    }

    // ===== 목록 =====
    @Transactional(readOnly = true)
    public Page<SubmissionDtos.Item> list(Long challengeId, Pageable pageable) {
        var page = submissionRepo.findByChallenge_Id(challengeId, pageable);

        var ids = page.getContent().stream().map(Submission::getId).toList();
        if (ids.isEmpty()) return page.map(SubmissionDtos.Item::from);

        // 에셋 그룹핑
        var assets = assetRepo.findBySubmission_IdInOrderByIdAsc(ids);
        Map<Long, List<SubmissionAsset>> grouped = assets.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getSubmission().getId()));

        // 오너 맵
        var ownerIds = page.getContent().stream().map(Submission::getOwnerId).toList();
        List<User> owners = userRepo.findAllById(ownerIds);
        Map<Long, User> ownerById = owners.stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, Function.identity(), (a,b)->a));

        // 코드 언어 맵
        Map<Long, String> langBySubId = codeRepo.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CodeSubmission::getSubmissionId,
                        CodeSubmission::getLanguage,
                        (a,b)->a
                ));

        return page.map(s -> mapItem(
                s,
                grouped.getOrDefault(s.getId(), List.of()),
                ownerById.get(s.getOwnerId()),
                langBySubId.get(s.getId())
        ));
    }

    // ===== 단건 + 조회수 증가 =====
    @Transactional
    public SubmissionDtos.Item getAndIncreaseView(Long challengeId, Long submissionId,
                                                  Long viewerId, HttpServletRequest req) {
        var s = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Submission not found"));
        if (!s.getChallenge().getId().equals(challengeId))
            throw new ResponseStatusException(BAD_REQUEST, "MISMATCH_CHALLENGE");

        // 조회수 증가 (중복 방지 포함)
        subViewService.handleSubmissionView(s.getId(), s.getOwnerId(), viewerId, req);

        // 단건 매핑
        var assets = assetRepo.findBySubmission_IdInOrderByIdAsc(List.of(submissionId));
        var owner = userRepo.findById(s.getOwnerId()).orElse(null);
        var code = codeRepo.findBySubmission_Id(submissionId).orElse(null);
        return mapItem(s, assets, owner, code == null ? null : code.getLanguage());
    }

    // ===== 헬퍼: Submission -> Item 매핑 =====
    private SubmissionDtos.Item mapItem(Submission s,
                                        List<SubmissionAsset> assets,
                                        User owner,
                                        String language) {

        // coverUrl 우선 → 없으면 첫 에셋
        String cover = (s.getCoverUrl() != null && !s.getCoverUrl().isBlank())
                ? s.getCoverUrl()
                : (assets.isEmpty() ? null : assets.get(0).getUrl());
        int count = assets.size();

        boolean isCode = (s.getChallenge().getType() == ChallengeType.CODE);
        String commentType = isCode ? "CODE_SUBMISSION" : "PORTFOLIO_SUBMISSION";
        var lt = isCode
                ? com.sandwich.SandWich.social.domain.LikeTargetType.CODE_SUBMISSION
                : com.sandwich.SandWich.social.domain.LikeTargetType.PORTFOLIO_SUBMISSION;

        long likeCnt = likeRepo.countByTargetTypeAndTargetId(lt, s.getId());
        long cmtCnt  = commentRepo.countByCommentableTypeAndCommentableId(commentType, s.getId());
        long viewCnt = subViewQuery.getTotalViewCount(s.getId());

        SubmissionDtos.Item.Owner ownerDto = (owner == null) ? null :
                SubmissionDtos.Item.Owner.builder()
                        .userId(owner.getId())
                        .username(owner.getNickname())
                        .profileImageUrl(owner.getProfileImageUrl())
                        .position(safePosition(owner))
                        .build();

        return SubmissionDtos.Item.from(s).toBuilder()
                .coverUrl(cover)
                .assetCount(count)
                .viewCount(viewCnt)
                .likeCount(likeCnt)
                .commentCount(cmtCnt)
                .owner(ownerDto)
                .language(language)
                .totalScore(0.0) // TODO: 코드 챌린지 점수 연동 시 교체
                .build();
    }

    private Long currentSafeUserId() {
        try {
            return currentUser.currentUserId();
        } catch (Exception e) {
            throw new ResponseStatusException(UNAUTHORIZED, "Login required");
        }
    }

    // User 엔티티에 position 게터가 없을 수 있어 리플렉션으로 안전 접근
    private String safePosition(User u) {
        if (u == null) return null;
        for (String mName : new String[]{"getPosition", "getJobTitle", "getRoleName"}) {
            try {
                Method m = u.getClass().getMethod(mName);
                Object v = m.invoke(u);
                return (v == null) ? null : String.valueOf(v);
            } catch (Exception ignore) { /* try next */ }
        }
        return null;
    }
}
