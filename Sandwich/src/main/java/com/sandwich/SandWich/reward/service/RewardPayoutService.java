package com.sandwich.SandWich.reward.service;


import com.sandwich.SandWich.reward.RewardProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class RewardPayoutService {

    private final JdbcTemplate jdbc;
    private final RewardProperties props;

    @Transactional(readOnly = true)
    public boolean isPublished(long challengeId) {
        Integer cnt = jdbc.queryForObject(
                "SELECT COUNT(*) FROM reward_payout WHERE challenge_id = ?",
                Integer.class, challengeId
        );
        return cnt != null && cnt > 0;
    }

    @Transactional
    public int publishPortfolioResults(long challengeId, RewardRule rule) {
        // 투표 종료 검증: challenge.vote_end_at 기준 (필드명이 다르면 맞춰서 수정)
        Boolean finished = jdbc.queryForObject("""
           SELECT (vote_end_at IS NOT NULL AND NOW() >= vote_end_at) AS finished
           FROM challenge WHERE id = ?
        """, Boolean.class, challengeId);
        if (finished == null || !finished) throw new IllegalStateException("voting_not_finished");

        // 1) 랭킹 조회 (총점 DESC → 표 수 DESC → submission_id ASC)
        List<Map<String,Object>> rows = jdbc.queryForList("""
          SELECT s.owner_id AS user_id
          FROM portfolio_vote v
          JOIN submission s ON s.id = v.submission_id
          WHERE v.challenge_id = ?
          GROUP BY s.owner_id, v.submission_id
          ORDER BY
            (AVG(v.ui_ux)+AVG(v.creativity)+AVG(v.code_quality)+AVG(v.difficulty))/4.0 DESC,
            COUNT(*) DESC,
            v.submission_id ASC
        """, challengeId);

        int affected = 0;

        // 2) 상위 N 지급
        int winners = Math.min(rule.top().size(), rows.size());
        for (int i = 0; i < winners; i++) {
            long userId = ((Number) rows.get(i).get("user_id")).longValue();
            long amount = rule.top().get(i);
            affected += payoutOne(challengeId, userId, amount, i + 1);
        }

        // 3) 참가자 공통 지급(옵션)
        if (rule.participant() != null && rule.participant() > 0) {
            List<Long> participants = jdbc.queryForList("""
              SELECT DISTINCT owner_id
              FROM submission
              WHERE challenge_id = ?
            """, Long.class, challengeId);

            for (Long uid : participants) {
                affected += payoutOne(challengeId, uid, rule.participant(), null);
            }
        }
        return affected; // 이번 호출에서 실제 insert된 reward_payout 행 수
    }

    private int payoutOne(long challengeId, long userId, long amount, Integer rank) {
        // 멱등 upsert + 타임스탬프 명시
        int inserted = jdbc.update("""
      INSERT INTO reward_payout (challenge_id, user_id, amount, rank, created_at, updated_at)
      VALUES (?, ?, ?, ?, now(), now())
      ON CONFLICT (challenge_id, user_id) DO NOTHING
    """, ps -> {
            ps.setLong(1, challengeId);
            ps.setLong(2, userId);
            ps.setLong(3, amount);
            if (rank == null) ps.setNull(4, java.sql.Types.INTEGER);
            else ps.setInt(4, rank);
        });

        if (inserted == 1 && props.isApplyCredits()) {
            // 거래 기록: created_at / updated_at 명시
            jdbc.update("""
              INSERT INTO credit_txn(user_id, amount, reason, ref_id, created_at, updated_at)
              VALUES (?, ?, 'REWARD', ?, now(), now())
            """, userId, amount, challengeId);

            // 지갑 upsert: created_at / updated_at 명시 + UPDATE 시 updated_at 갱신
            jdbc.update("""
              INSERT INTO credit_wallet(user_id, balance, created_at, updated_at)
              VALUES (?, ?, now(), now())
              ON CONFLICT (user_id) DO UPDATE SET
                balance    = credit_wallet.balance + EXCLUDED.balance,
                updated_at = now()
            """, userId, amount);
        }
        return inserted;
    }

}