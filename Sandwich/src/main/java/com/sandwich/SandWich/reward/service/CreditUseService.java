package com.sandwich.SandWich.reward.service;

import com.sandwich.SandWich.reward.RewardProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CreditUseService {

    private final JdbcTemplate jdbc;
    private final RewardProperties props;

    /**
     * 크레딧 사용(차감)
     * @return 사용 후 남은 잔액
     */
    @Transactional
    public long useCredits(long userId, long amount, String reason, Long refId) {
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be positive");
        }

        // reward.apply-credits=false면 원래 지급/지갑 기능 안 쓰는 모드니까, 사용도 막는 게 자연스러움
        if (!props.isApplyCredits()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "credits_not_enabled");
        }

        // 현재 잔액 조회 (없으면 0)
        Long balObj = jdbc.queryForObject(
                "SELECT COALESCE((SELECT balance FROM credit_wallet WHERE user_id = ?), 0)::bigint",
                Long.class,
                userId
        );
        long balance = (balObj == null) ? 0L : balObj;

        if (balance < amount) {
            // 잔액 부족
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "insufficient_balance");
        }

        long delta = -amount;
        String finalReason = (reason == null || reason.isBlank())
                ? "SPEND_FEATURE"
                : reason;

        // 1) 사용 내역을 credit_txn에 기록 (amount는 음수)
        jdbc.update("""
            INSERT INTO credit_txn (user_id, amount, reason, ref_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, now(), now())
        """, userId, delta, finalReason, refId);

        // 2) 지갑에서 잔액 차감
        jdbc.update("""
            INSERT INTO credit_wallet (user_id, balance, created_at, updated_at)
            VALUES (?, ?, now(), now())
            ON CONFLICT (user_id) DO UPDATE SET
              balance    = credit_wallet.balance + EXCLUDED.balance,
              updated_at = now()
        """, userId, delta);

        return balance + delta; // = balance - amount
    }
}
