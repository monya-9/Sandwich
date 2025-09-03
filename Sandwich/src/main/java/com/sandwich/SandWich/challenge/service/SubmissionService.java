package com.sandwich.SandWich.challenge.service;

import com.sandwich.SandWich.challenge.domain.*;
import com.sandwich.SandWich.challenge.dto.SubmissionDtos;
import com.sandwich.SandWich.challenge.repository.*;
import com.sandwich.SandWich.challenge.event.SubmissionCreatedEvent;
import com.sandwich.SandWich.auth.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;

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


    private static final Set<String> ALLOWED_LANG =
            Set.of("java","kotlin","python","node","js","ts","go","rust","cpp","c","ruby","php");

    @Transactional
    public Long create(Long challengeId, SubmissionDtos.CreateReq req) {
        var ch = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Challenge not found"));

        return (ch.getType() == ChallengeType.CODE)
                ? createCode(ch, req)
                : createPortfolio(ch, req);
    }

    // ===== 포트폴리오  =====
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
                .descr(req.getDescr())
                .repoUrl(req.getRepoUrl())
                .demoUrl(req.getDemoUrl())
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

        publisher.publishEvent(new SubmissionCreatedEvent(
                sub.getId(), ch.getId(), userId, sub.getTitle(), sub.getRepoUrl(), sub.getDemoUrl()
        ));

        return sub.getId();
    }

    // ===== 코드 챌린지 =====
    private Long createCode(Challenge ch, SubmissionDtos.CreateReq req) {
        // 기간 체크
        var now = java.time.OffsetDateTime.now();
        if (!now.isBefore(ch.getEndAt()))
            throw new ResponseStatusException(BAD_REQUEST, "Submission closed");

        // 필드 검증
        if (req.getCode() == null)
            throw new ResponseStatusException(BAD_REQUEST, "code block required");
        var code = req.getCode();

        var lang = code.getLanguage() == null ? "" : code.getLanguage().toLowerCase();
        if (!ALLOWED_LANG.contains(lang))
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported language: " + code.getLanguage());

        Long userId = currentSafeUserId();
        if (submissionRepo.existsByChallenge_IdAndOwnerId(ch.getId(), userId))
            throw new ResponseStatusException(CONFLICT, "Already submitted for this challenge");

        // 제출본 생성(PENDING)
        var sub = Submission.builder()
                .challenge(ch)
                .ownerId(userId)
                .title(req.getTitle())
                .descr(req.getDescr())
                .repoUrl(req.getRepoUrl())
                .demoUrl(req.getDemoUrl())
                .status(SubmissionStatus.PENDING)
                .build();
        sub = submissionRepo.save(sub);

        // 코드 메타 생성
        var cs = CodeSubmission.builder()
                .submission(sub)
                .language(lang)
                .entrypoint(code.getEntrypoint())
                .commitSha(code.getCommitSha())
                .build();
        codeRepo.save(cs);

        // (선택) 포트폴리오와 동일 이벤트로 운영 알림 연결
        publisher.publishEvent(new SubmissionCreatedEvent(
                sub.getId(), ch.getId(), userId, sub.getTitle(), sub.getRepoUrl(), sub.getDemoUrl()
        ));

        return sub.getId();
    }

    @Transactional(readOnly = true)
    public Page<SubmissionDtos.Item> list(Long challengeId, Pageable pageable) {
        var page = submissionRepo.findByChallenge_Id(challengeId, pageable);

        // 1) 이번 페이지의 submissionId 모으기
        var ids = page.stream().map(Submission::getId).toList();
        if (ids.isEmpty()) return page.map(SubmissionDtos.Item::from);

        // 2) 에셋 한 번에 로드 후 그룹핑
        var assets = assetRepo.findBySubmission_IdInOrderByIdAsc(ids);
        Map<Long, List<SubmissionAsset>> grouped = assets.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getSubmission().getId()));

        // 3) 각 제출물에 coverUrl/assetCount 채워서 반환
        return page.map(s -> {
            var list = grouped.getOrDefault(s.getId(), java.util.List.of());
            String cover = list.isEmpty() ? null : list.get(0).getUrl(); // 첫 이미지 = cover
            int count = list.size();
            return SubmissionDtos.Item.from(s).toBuilder()
                    .coverUrl(cover)
                    .assetCount(count)
                    .build();
        });
    }

    private Long currentSafeUserId() {
        try {
            return currentUser.currentUserId();
        } catch (Exception e) {
            // 컨트롤러 응답은 401로
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Login required"
            );
        }
    }
}