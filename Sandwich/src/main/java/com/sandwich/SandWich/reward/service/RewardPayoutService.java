package com.sandwich.SandWich.reward.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.reward.RewardProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.internal.ai.AiJudgeClient;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RewardPayoutService {

    private final JdbcTemplate jdbc;
    private final RewardProperties props;
    private final AiJudgeClient aiJudgeClient;
    private final RedisUtil redisUtil;

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
        // 투표 종료 검증
        Boolean finished = jdbc.queryForObject("""
       SELECT (vote_end_at IS NOT NULL AND NOW() >= vote_end_at) AS finished
       FROM challenge WHERE id = ?
    """, Boolean.class, challengeId);
        if (finished == null || !finished) throw new IllegalStateException("voting_not_finished");

        // 1) 랭킹 조회
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
        int winners = Math.min(rule.safeTop().size(), rows.size());
        java.util.Set<Long> winnerIds = new java.util.HashSet<>();

        for (int i = 0; i < winners; i++) {
            long userId = ((Number) rows.get(i).get("user_id")).longValue();
            long amount = rule.top().get(i);
            affected += payoutOne(challengeId, userId, amount, i + 1);
            winnerIds.add(userId);
        }

        // 3) 참가자 공통 지급 (상위 N 제외)
        long participantAmt = rule.safeParticipant();
        if (participantAmt > 0) {
            List<Long> participants = jdbc.queryForList("""
          SELECT DISTINCT owner_id
          FROM submission
          WHERE challenge_id = ?
        """, Long.class, challengeId);

            for (Long uid : participants) {
                if (!winnerIds.contains(uid)) {
                    affected += payoutOne(challengeId, uid, participantAmt, null);
                }
            }
        }

        return affected;
    }

    @Transactional
    public int publishCodeResults(long challengeId, RewardRule rule, String aiWeek) {
        var resp = aiJudgeClient.getWeeklyLeaderboard(aiWeek);
        if (resp == null || resp.leaderboard() == null || resp.leaderboard().isEmpty())
            throw new IllegalStateException("AI 리더보드가 비었습니다: " + aiWeek);

        int affected = 0;
        var entries = resp.leaderboard();

        // 1) 상위 N 지급
        int winners = Math.min(rule.top().size(), entries.size());
        java.util.Set<Long> winnerIds = new java.util.HashSet<>();

        for (int i = 0; i < winners; i++) {
            String aiUser = entries.get(i).user();
            Long userId = resolveUserIdFromAiUser(aiUser);
            if (userId != null) {
                long amount = rule.top().get(i);
                affected += payoutOne(challengeId, userId, amount, i + 1);
                winnerIds.add(userId);
            }
        }

        // 2) 참가자 공통 지급 (상위 N 제외)
        long participantAmt = rule.safeParticipant();
        if (participantAmt > 0) {
            for (var entry : entries) {
                Long userId = resolveUserIdFromAiUser(entry.user());
                if (userId != null && !winnerIds.contains(userId)) {
                    affected += payoutOne(challengeId, userId, participantAmt, null);
                }
            }
        }

        return affected;
    }

    private Long resolveUserIdFromAiUser(String aiUser) {
        if (aiUser == null || aiUser.isBlank()) return null;

        // 1) 숫자 문자열이면 '그 자체가 users.id'
        try {
            long id = Long.parseLong(aiUser.trim());
            // 존재 확인
            List<Long> ok = jdbc.query("SELECT id FROM users WHERE id = ? AND is_deleted = false LIMIT 1",
                    (rs, i) -> rs.getLong(1), id);
            return ok.isEmpty() ? null : id;
        } catch (NumberFormatException ignore) {
            // 2) (옵션) 숫자가 아니라면 username으로 fallback (원치 않으면 이 블럭 삭제)
            List<Long> list = jdbc.query("""
            SELECT id FROM users
            WHERE username = ? AND is_deleted = false
            LIMIT 1
        """, (rs, i) -> rs.getLong(1), aiUser);
            return list.isEmpty() ? null : list.get(0);
        }
    }

    private Long parseId(String s) {
        try {
            return (s == null || s.isBlank()) ? null : Long.parseLong(s.trim());
        } catch (NumberFormatException ignore) {
            return null;
        }
    }

    private Long findUserIdByUsername(String username) {
        List<Long> list = jdbc.query("""
        SELECT id FROM users
        WHERE username = ? AND is_deleted = false
        LIMIT 1
    """, (rs, i) -> rs.getLong(1), username);
        return list.isEmpty() ? null : list.get(0);
    }

    @Transactional
    public int publishCustomPayout(long challengeId, long userId, long amount,
                                   @org.springframework.lang.Nullable Integer rank,
                                   String reason,  // 예: "REWARD_CUSTOM"
                                   @org.springframework.lang.Nullable String memo,
                                   @org.springframework.lang.Nullable String idempotencyKey) {
        // (A) 멱등키가 오면 5~10분 잠금으로 재클릭 방지
        if (idempotencyKey != null && !idempotencyKey.isBlank() && redisUtil != null) {
            String key = "idem:reward:custom:%s".formatted(idempotencyKey);
            if (Boolean.TRUE.equals(redisUtil.hasKey(key))) {
                throw new com.sandwich.SandWich.common.exception.exceptiontype.ConflictException(
                        "IDEMPOTENT_REPLAY", "이미 처리된 커스텀 지급입니다.");
            }
            redisUtil.setDuplicateTTLKey(key, 10, java.util.concurrent.TimeUnit.MINUTES);
        }

        // (B) 지급 실행 — 집계 테이블은 누적 가산, 트랜잭션은 라인아이템 기록
        return payoutOneWithReason(challengeId, userId, amount, rank, reason, memo);
    }

    // 기존 publishPortfolioResults/publishCodeResults 내부에서 쓰던 메서드의 확장 버전
    private int payoutOneWithReason(long challengeId, long userId, long amount,
                                    @org.springframework.lang.Nullable Integer rank,
                                    String reason, @org.springframework.lang.Nullable String memo) {
        // 1) reward_payout: (challenge_id, user_id) 단일 행에 누적
        int upserted = jdbc.update("""
          INSERT INTO reward_payout (challenge_id, user_id, amount, rank, created_at, updated_at)
          VALUES (?, ?, ?, ?, now(), now())
          ON CONFLICT (challenge_id, user_id) DO UPDATE
          SET amount     = reward_payout.amount + EXCLUDED.amount,
              rank       = COALESCE(LEAST(reward_payout.rank, EXCLUDED.rank), EXCLUDED.rank),
              updated_at = now()
        """, ps -> {
            ps.setLong(1, challengeId);
            ps.setLong(2, userId);
            ps.setLong(3, amount);
            if (rank == null) ps.setNull(4, java.sql.Types.INTEGER);
            else ps.setInt(4, rank);
        });

        if (upserted > 0 && props.isApplyCredits()) {
            // 2) credit_txn: 라인아이템으로 항상 기록 (이력이 여기 남음)
            jdbc.update("""
              INSERT INTO credit_txn(user_id, amount, reason, ref_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, now(), now())
            """, userId, amount, (reason==null||reason.isBlank()?"REWARD":reason), challengeId);

            // (선택) memo 저장을 원하면 credit_txn 테이블에 meta_json 같은 컬럼을 추가하세요.
            // 없으면 memo는 AdminAuditLog 쪽에 남기는 것으로 충분합니다.

            // 3) wallet 반영
            jdbc.update("""
              INSERT INTO credit_wallet(user_id, balance, created_at, updated_at)
              VALUES (?, ?, now(), now())
              ON CONFLICT (user_id) DO UPDATE SET
                balance    = credit_wallet.balance + EXCLUDED.balance,
                updated_at = now()
            """, userId, amount);
        }
        return upserted;
    }

    // 호환성을 위해 기존 호출부는 그대로:
    private int payoutOne(long challengeId, long userId, long amount, Integer rank) {
        return payoutOneWithReason(challengeId, userId, amount, rank, "REWARD", null);
    }
}
