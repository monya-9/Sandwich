package com.sandwich.SandWich.challenge.scheduler;

import com.sandwich.SandWich.challenge.scheduler.ChallengeScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/_ops/challenges")
@RequiredArgsConstructor
public class ChallengeOpsController {

    private final ChallengeScheduler scheduler;

    // ADMIN만 강제 한 틱 실행
    @PostMapping("/scheduler/tick")
    @PreAuthorize("hasRole('ADMIN')")
    public String tickOnce() {
        scheduler.tick();
        return "OK";
    }
}