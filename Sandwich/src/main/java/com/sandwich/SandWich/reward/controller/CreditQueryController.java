package com.sandwich.SandWich.reward.controller;

import com.sandwich.SandWich.auth.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "reward.enabled", havingValue = "true", matchIfMissing = true)
public class CreditQueryController {

    private final JdbcTemplate jdbc;
    private final CurrentUserProvider currentUser; // 프로젝트에 있는 인터페이스/컴포넌트를 사용

    @GetMapping("/credits")
    public Map<String,Object> myCredits() {
        long uid = currentUser.currentUserId();

        Long balObj = jdbc.queryForObject(
                "SELECT COALESCE((SELECT balance FROM credit_wallet WHERE user_id = ?), 0)::bigint",
                Long.class, uid
        );
      List<Map<String,Object>> txns = jdbc.queryForList("""
            SELECT amount, reason, ref_id, created_at
            FROM credit_txn
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 50
        """, uid);
        long balance = (balObj != null) ? balObj : 0L;
        return Map.of("balance", balance, "txns", txns);
    }

    @GetMapping("/rewards")
    public List<Map<String,Object>> myRewards() {
        long uid = currentUser.currentUserId();
        return jdbc.queryForList("""
      SELECT r.challenge_id,
             c.title AS challenge_title,
             r.amount,
             r.rank,
             r.created_at
      FROM reward_payout r
      JOIN challenge c ON r.challenge_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    """, uid);
    }
}