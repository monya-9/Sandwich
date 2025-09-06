package com.sandwich.SandWich.reward.web;

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
        Long bal = jdbc.queryForObject("SELECT balance FROM credit_wallet WHERE user_id = ?", Long.class, uid);
        List<Map<String,Object>> txns = jdbc.queryForList("""
            SELECT amount, reason, ref_id, created_at
            FROM credit_txn
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 50
        """, uid);
        return Map.of("balance", bal == null ? 0 : bal, "txns", txns);
    }

    @GetMapping("/rewards")
    public List<Map<String,Object>> myRewards() {
        long uid = currentUser.currentUserId();
        return jdbc.queryForList("""
          SELECT challenge_id, amount, rank, created_at
          FROM reward_payout
          WHERE user_id = ?
          ORDER BY created_at DESC
        """, uid);
    }
}