package com.sandwich.SandWich.reward;

import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RewardAutoPublisher {

    private final RewardAutoPublishProperties props;
    private final RewardPayoutService service;
    private final TaskScheduler taskScheduler; // Spring 기본 scheduler (없으면 @EnableScheduling 환경으로 제공)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ChallengeLifecycleEvent e) {
        if (!props.isEnabled()) return;
        if (e.type() != ChallengeType.PORTFOLIO) return;         // 포폴만 자동 발표
        if (e.next() != com.sandwich.SandWich.challenge.domain.ChallengeStatus.ENDED) return;

        Runnable job = () -> {
            try {
                List<Long> top = props.topList();
                Long participant = props.getParticipant() == null ? 0L : props.getParticipant();
                var rule = new RewardRule(top, participant > 0 ? participant : null);

                if (props.isDryRun()) {
                    log.info("[REWARD][AUTO][DRYRUN] ch={} top={} participant={}", e.challengeId(), top, participant);
                    return;
                }

                int inserted = service.publishPortfolioResults(e.challengeId(), rule);
                log.info("[REWARD][AUTO] ch={} inserted={} top={} participant={}", e.challengeId(), inserted, top, participant);
            } catch (Exception ex) {
                log.warn("[REWARD][AUTO][ERR] ch={} {}", e.challengeId(), ex.toString());
            }
        };

        int delay = Math.max(0, props.getDelaySec());
        if (delay > 0) {
            taskScheduler.schedule(job, java.util.Date.from(java.time.Instant.now().plusSeconds(delay)));
        } else {
            job.run();
        }
    }
}