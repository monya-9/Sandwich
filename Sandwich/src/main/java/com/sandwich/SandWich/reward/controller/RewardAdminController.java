package com.sandwich.SandWich.reward.controller;

import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping(value = "/admin/rewards", produces = "application/json")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "reward.enabled", havingValue = "true", matchIfMissing = true)
public class RewardAdminController {

    private final RewardPayoutService service;
    private final JdbcTemplate jdbc;
    public record PublishReq(List<Long> top, Long participant) {}

    @PostMapping("/{id}/publish-results")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> publish(@PathVariable long id, @RequestBody PublishReq req) {
        var rule = new RewardRule(
                req.top() == null ? List.of() : req.top(),
                req.participant()
        );
        var chType = jdbc.queryForObject("select type from challenge where id=?", String.class, id);

        int inserted;
        if ("CODE".equals(chType)) {
            var aiWeek = jdbc.queryForObject("select ai_week from challenge where id=?", String.class, id);
            if (aiWeek == null || aiWeek.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "ai_week required");
            inserted = service.publishCodeResults(id, rule, aiWeek);
        } else {
            inserted = service.publishPortfolioResults(id, rule);
        }
        return Map.of("inserted", inserted, "type", chType, "top", rule.top(), "participant", rule.participant());
    }
    // 기본 보상표: Top [10000,5000,3000], 참가 500
    @PostMapping("/{id}/publish-results/default")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> publishDefault(@PathVariable long id) {
        var rule = new RewardRule(List.of(10000L, 5000L, 3000L), 500L);
        int inserted = service.publishPortfolioResults(id, rule);
        return Map.of("inserted", inserted, "default", true);
    }
}