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

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final ChallengeRepository challengeRepo;
    private final SubmissionRepository submissionRepo;
    private final SubmissionAssetRepository assetRepo;
    private final CurrentUserProvider currentUser;
    private final ApplicationEventPublisher publisher;

    @Transactional
    public Long createPortfolio(Long challengeId, SubmissionDtos.CreateReq req) {
        var ch = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Challenge not found"));

        if (ch.getType() != ChallengeType.PORTFOLIO)
            throw new ResponseStatusException(BAD_REQUEST, "Only PORTFOLIO challenge accepts submissions");

        var now = java.time.OffsetDateTime.now();
        if (!(now.isBefore(ch.getEndAt())))
            throw new ResponseStatusException(BAD_REQUEST, "Submission closed");

        Long userId = currentSafeUserId();

        if (submissionRepo.existsByChallenge_IdAndOwnerId(challengeId, userId))
            throw new ResponseStatusException(CONFLICT, "Already submitted for this challenge");

        var sub = Submission.builder()
                .challenge(ch)
                .ownerId(userId)
                .title(req.getTitle())
                .descr(req.getDescr())
                .repoUrl(req.getRepoUrl())
                .demoUrl(req.getDemoUrl())
                .extraJson("{}")
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

        // 운영 알림 이벤트 (AFTER_COMMIT에서 outbox 기록)
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