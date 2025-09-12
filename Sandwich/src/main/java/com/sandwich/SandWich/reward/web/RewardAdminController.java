package com.sandwich.SandWich.reward.web;

import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/admin/rewards", produces = "application/json")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "reward.enabled", havingValue = "true", matchIfMissing = true)
public class RewardAdminController {

    private final RewardPayoutService service;

    public record PublishReq(List<Long> top, Long participant) {}

    @PostMapping(value = "/{id}/publish-results", consumes = "application/json")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> publish(@PathVariable long id, @RequestBody PublishReq req) {
        var rule = new RewardRule(req.top() == null ? List.of() : req.top(), req.participant());
        int inserted = service.publishPortfolioResults(id, rule);
        return Map.of(
                "inserted", inserted,
                "top", rule.top(),
                "participant", rule.participant()
        );
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