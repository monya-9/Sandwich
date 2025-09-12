package com.sandwich.SandWich.challenge.scheduler;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "challenge.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class ChallengeScheduler {

    private final ChallengeRepository repo;
    private final ApplicationEventPublisher publisher;

    @Value("${challenge.scheduler.zoneId:Asia/Seoul}")
    private String zoneId;

    @Scheduled(fixedDelayString = "${challenge.scheduler.fixedDelay:15000}")
    @Transactional
    public void tick() {
        ZoneId zone = ZoneId.of(zoneId);
        OffsetDateTime now = ZonedDateTime.now(zone).toOffsetDateTime();

        // 1) DRAFT → OPEN
        for (var c : repo.findDraftsToOpen(now)) {
            if (repo.advanceStatus(c.getId(), ChallengeStatus.DRAFT, ChallengeStatus.OPEN) == 1) {
                log.info("[CH-SCHED] {} DRAFT→OPEN at {}", c.getId(), now);
                publisher.publishEvent(new ChallengeLifecycleEvent(
                        c.getId(), c.getType(), ChallengeStatus.DRAFT, ChallengeStatus.OPEN));
            }
        }

        // 2) OPEN → VOTING (PORTFOLIO)
        for (var c : repo.findOpensToVoting(now)) {
            if (repo.advanceStatus(c.getId(), ChallengeStatus.OPEN, ChallengeStatus.VOTING) == 1) {
                log.info("[CH-SCHED] {} OPEN→VOTING at {}", c.getId(), now);
                publisher.publishEvent(new ChallengeLifecycleEvent(
                        c.getId(), c.getType(), ChallengeStatus.OPEN, ChallengeStatus.VOTING));
            }
        }

        // 3) (OPEN|VOTING|DRAFT) → ENDED
        for (var c : repo.findToEnd(now)) {
            var prev = c.getStatus();
            if (repo.advanceStatus(c.getId(), prev, ChallengeStatus.ENDED) == 1) {
                log.info("[CH-SCHED] {} {}→ENDED at {}", c.getId(), prev, now);
                publisher.publishEvent(new ChallengeLifecycleEvent(
                        c.getId(), c.getType(), prev, ChallengeStatus.ENDED));
            }
        }
    }
}