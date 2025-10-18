package com.sandwich.SandWich.challenge.dto;

import lombok.Builder;
import java.util.List;

public class LeaderboardDtos {
    @Builder
    public record Owner(
            Long userId,
            String username,
            String profileImageUrl
    ) {}

    @Builder
    public record Item(
            Long submissionId, int voteCount,
            double uiUxAvg, double creativityAvg, double codeQualityAvg, double difficultyAvg,
            double totalScore, Integer rank,
            String teamName,
            Owner owner
    ) {}

    @Builder
    public record Resp(List<Item> items, boolean cacheHit, long generatedAt) {}
}