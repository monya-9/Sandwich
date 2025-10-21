package com.sandwich.SandWich.reward;

import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RewardAutoPublisher {

    private final RewardAutoPublishProperties props;
    private final RewardPayoutService service;
    private final TaskScheduler taskScheduler;
    private final JdbcTemplate jdbc;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ChallengeLifecycleEvent e) {
        if (!props.isEnabled()) return;
        if (e.next() != ChallengeStatus.ENDED) return; // ENDED일 때만

        // 공통: 보상 규칙 구성
        List<Long> top = props.topList();
        Long participant = props.getParticipant() == null ? 0L : props.getParticipant();
        var rule = new RewardRule(top, participant > 0 ? participant : null);

        Runnable job = () -> {
            try {
                if (props.isDryRun()) {
                    log.info("[REWARD][AUTO][DRYRUN] ch={} type={} top={} participant={}",
                            e.challengeId(), e.type(), top, participant);
                    return;
                }

                int inserted = 0;

                // 타입 분기
                if (e.type() == ChallengeType.PORTFOLIO) {
                    // 기존: 투표 집계 기반
                    inserted = service.publishPortfolioResults(e.challengeId(), rule);

                } else if (e.type() == ChallengeType.CODE) {
                    // 신규: AI 리더보드 기반 (ai_week 필요)
                    String aiWeek = jdbc.queryForObject(
                            "SELECT ai_week FROM challenge WHERE id = ?",
                            String.class, e.challengeId());

                    if (aiWeek == null || aiWeek.isBlank()) {
                        log.warn("[REWARD][AUTO][SKIP] ch={} type=CODE ai_week is null/blank", e.challengeId());
                        return; // 안전 스킵
                    }

                    inserted = service.publishCodeResults(e.challengeId(), rule, aiWeek);

                } else {
                    // 그 외 타입은 스킵
                    log.info("[REWARD][AUTO][SKIP] ch={} unsupported type={}", e.challengeId(), e.type());
                    return;
                }

                log.info("[REWARD][AUTO] ch={} type={} inserted={} top={} participant={}",
                        e.challengeId(), e.type(), inserted, top, participant);

            } catch (Exception ex) {
                // 예외는 nuh-uh! 잡고 로깅
                log.warn("[REWARD][AUTO][ERR] ch={} type={} err={}",
                        e.challengeId(), e.type(), ex.toString());
            }
        };

        int delay = Math.max(0, props.getDelaySec());
        if (delay > 0) {
            taskScheduler.schedule(job, Date.from(Instant.now().plusSeconds(delay)));
        } else {
            job.run();
        }
    }
}
