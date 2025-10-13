package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.dto.SyncAiDtos;
import com.sandwich.SandWich.challenge.service.ChallengeSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/challenges")
public class ChallengeSyncController {

    private final ChallengeSyncService service;

    @PostMapping("/sync-ai-monthly")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_SERVICE')")
    public ResponseEntity<SyncAiDtos.SyncResp> syncMonthly(@RequestBody @Validated SyncAiDtos.MonthlyReq req) {
        var c = service.upsertMonthlyPortfolio(req);
        return ResponseEntity.ok(
                SyncAiDtos.SyncResp.of(c.getId(), c.getStatus().name(), "AI 챌린지가 성공적으로 생성되었습니다")
        );
    }

    @PostMapping("/sync-ai-weekly")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_SERVICE')")
    public ResponseEntity<SyncAiDtos.SyncResp> syncWeekly(@RequestBody @Validated SyncAiDtos.WeeklyReq req) {
        var c = service.upsertWeeklyCode(req);
        return ResponseEntity.ok(
                SyncAiDtos.SyncResp.of(c.getId(), c.getStatus().name(), "AI 챌린지가 성공적으로 생성되었습니다")
        );
    }

    // 최신 또는 특정 ym을 AI에서 끌어와 업서트
    @GetMapping("/sync-ai-monthly/fetch")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_SERVICE')")
    public ResponseEntity<SyncAiDtos.SyncResp> fetchMonthly(@RequestParam(required=false) String ym) {
        var c = service.fetchAndUpsertMonthly(ym);
        return ResponseEntity.ok(SyncAiDtos.SyncResp.of(c.getId(), c.getStatus().name(), "AI 월간을 동기화했습니다"));
    }

    // 최신 또는 특정 week를 AI에서 끌어와 업서트
    @GetMapping("/sync-ai-weekly/fetch")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_SERVICE')")
    public ResponseEntity<SyncAiDtos.SyncResp> fetchWeekly(@RequestParam(required=false) String week) {
        var c = service.fetchAndUpsertWeekly(week);
        return ResponseEntity.ok(SyncAiDtos.SyncResp.of(c.getId(), c.getStatus().name(), "AI 주간을 동기화했습니다"));
    }
}
