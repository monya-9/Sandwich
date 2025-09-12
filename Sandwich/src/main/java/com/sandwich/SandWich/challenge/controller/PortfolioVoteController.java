package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.dto.VoteDtos;
import com.sandwich.SandWich.challenge.service.PortfolioVoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges/{challengeId}/votes")
@RequiredArgsConstructor
public class PortfolioVoteController {

    private final PortfolioVoteService service;

    public record IdResp(Long id) {}

    @PostMapping
    public IdResp create(@PathVariable Long challengeId, @RequestBody @Valid VoteDtos.CreateOrUpdateReq req) {
        return new IdResp(service.create(challengeId, req));
    }

    @PutMapping("/me")
    public void updateMy(@PathVariable Long challengeId, @RequestBody @Valid VoteDtos.CreateOrUpdateReq req) {
        service.updateMy(challengeId, req);
    }

    @GetMapping("/me")
    public VoteDtos.MyVoteResp myVote(@PathVariable Long challengeId) {
        return service.myVote(challengeId);
    }

    @GetMapping("/summary")
    public List<VoteDtos.SummaryItem> summary(@PathVariable Long challengeId) {
        return service.summary(challengeId);
    }
}