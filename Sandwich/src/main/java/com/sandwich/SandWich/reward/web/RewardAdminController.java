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
@RequestMapping("/admin/challenges")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "reward.enabled", havingValue = "true", matchIfMissing = true)
public class RewardAdminController {

    private final RewardPayoutService service;

    public record PublishReq(List<Long> top, Long participant) {}

    @PostMapping("/{id}/publish-results")
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
}