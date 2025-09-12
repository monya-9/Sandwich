package com.sandwich.SandWich.admin.web;

import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.CreateReq;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.PatchReq;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.PublishReq;
import com.sandwich.SandWich.admin.service.AdminChallengeService;

import com.sandwich.SandWich.reward.service.RewardRule;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/challenges")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminChallengeController {

    private final AdminChallengeService service;

    public record IdResp(Long id) {}

    @PostMapping
    public IdResp create(@RequestBody @Valid CreateReq req) {
        return new IdResp(service.create(req));
    }

    @PatchMapping("/{id}")
    public Map<String,Object> patch(@PathVariable Long id, @RequestBody @Valid PatchReq req) {
        service.patch(id, req);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/publish-results")
    public Map<String,Object> publish(@PathVariable Long id, @RequestBody PublishReq req) {
        var rule = new RewardRule(
                req.top() == null ? java.util.List.of() : req.top(),
                req.participant()
        );
        int inserted = service.publishResults(id, rule);
        return Map.of("inserted", inserted);
    }

    // 선택: 기본 보상표 엔드포인트(관리 편의)
    @PostMapping("/{id}/publish-results/default")
    public Map<String,Object> publishDefault(@PathVariable Long id) {
        var rule = new RewardRule(java.util.List.of(10000L, 5000L, 3000L), 500L);
        int inserted = service.publishResults(id, rule);
        return Map.of("inserted", inserted);
    }

    @PostMapping("/{id}/rebuild-leaderboard")
    public Map<String,Object> rebuild(@PathVariable Long id) {
        service.rebuildLeaderboard(id);
        return Map.of("result", "ok");
    }
}
