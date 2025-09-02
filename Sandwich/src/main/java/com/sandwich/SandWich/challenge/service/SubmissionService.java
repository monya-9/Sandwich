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
        return submissionRepo.findByChallenge_Id(challengeId, pageable).map(SubmissionDtos.Item::from);
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