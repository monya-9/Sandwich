package com.sandwich.SandWich.challenge.controller;


import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.dto.LeaderboardDtos;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.service.PortfolioLeaderboardCache;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/challenges/{id}/leaderboard")
public class LeaderboardController {

    private final ChallengeRepository challengeRepo;
    private final PortfolioLeaderboardCache cache;

    @GetMapping
    public ResponseEntity<LeaderboardDtos.Resp> get(@PathVariable Long id,
                                                    @RequestParam(defaultValue = "50") int limit) {
        var ch = challengeRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CHALLENGE_NOT_FOUND"));
        if (ch.getType() != ChallengeType.PORTFOLIO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ONLY_PORTFOLIO");
        }
        return ResponseEntity.ok(cache.get(id, Math.max(1, Math.min(limit, 200))));
    }
}
