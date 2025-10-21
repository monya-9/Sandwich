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

import java.time.*;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class RewardAutoPublisher {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private final RewardAutoPublishProperties props;
    private final RewardPayoutService service;
    private final TaskScheduler taskScheduler;
    private final JdbcTemplate jdbc;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ChallengeLifecycleEvent e) {
        if (!props.isEnabled()) return;
        if (e.next() != ChallengeStatus.ENDED) return; // ENDED일 때만

        // 보상 규칙
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

                int inserted;

                if (e.type() == ChallengeType.PORTFOLIO) {
                    // 포트폴리오: 투표 집계 기반
                    inserted = service.publishPortfolioResults(e.challengeId(), rule);

                } else if (e.type() == ChallengeType.CODE) {
                    // 코드: AI 리더보드 기반
                    String aiWeek = jdbc.queryForObject(
                            "SELECT ai_week FROM challenge WHERE id = ?",
                            String.class, e.challengeId());
                    if (aiWeek == null || aiWeek.isBlank()) {
                        log.warn("[REWARD][AUTO][SKIP] ch={} type=CODE ai_week is null/blank", e.challengeId());
                        return;
                    }
                    inserted = service.publishCodeResults(e.challengeId(), rule, aiWeek);

                } else {
                    log.info("[REWARD][AUTO][SKIP] ch={} unsupported type={}", e.challengeId(), e.type());
                    return;
                }

                log.info("[REWARD][AUTO] ch={} type={} inserted={} top={} participant={}",
                        e.challengeId(), e.type(), inserted, top, participant);

            } catch (Exception ex) {
                log.warn("[REWARD][AUTO][ERR] ch={} type={} err={}",
                        e.challengeId(), e.type(), ex.toString());
            }
        };

        // === 스케줄 계산 ===
        // 포트폴리오 → vote_end_at, 코드 → end_at 기준으로 '다음날 17:00(KST)'
        OffsetDateTime baseOdt = jdbc.queryForObject("""
            SELECT CASE
                     WHEN type = 'PORTFOLIO' THEN vote_end_at
                     ELSE end_at
                   END
            FROM challenge
            WHERE id = ?
        """, OffsetDateTime.class, e.challengeId());

        ZonedDateTime eventTimeKst = (baseOdt == null)
                ? ZonedDateTime.now(ZONE)
                : baseOdt.atZoneSameInstant(ZONE);

        ZonedDateTime runAtKst = eventTimeKst.toLocalDate()
                .plusDays(1)
                .atTime(17, 0)
                .atZone(ZONE);

        // 과거면 하루씩 밀어서 항상 미래 시점 보장
        ZonedDateTime nowKst = ZonedDateTime.now(ZONE);
        if (runAtKst.isBefore(nowKst)) {
            runAtKst = nowKst.toLocalDate().plusDays(1).atTime(17, 0).atZone(ZONE);
        }

        log.info("[REWARD][AUTO] ch={} schedule at {} (KST) [base={}, type={}]",
                e.challengeId(), runAtKst, Objects.toString(eventTimeKst), e.type());

        taskScheduler.schedule(job, Date.from(runAtKst.toInstant()));
    }
}
