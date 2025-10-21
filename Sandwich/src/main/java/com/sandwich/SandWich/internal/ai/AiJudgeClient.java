package com.sandwich.SandWich.internal.ai;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;

@Component
public class AiJudgeClient {
    private final WebClient client = WebClient.builder()
            .baseUrl("https://api.dnutzs.org")
            .build();

    public LeaderboardResp getWeeklyLeaderboard(String week) {
        return client.get()
                .uri("/api/reco/judge/leaderboard/{week}", week)
                .retrieve()
                .bodyToMono(LeaderboardResp.class)
                .block();
    }

    public record LeaderboardResp(String week, List<Entry> leaderboard) {
        public record Entry(String user, int rank, double score) {}
    }
}
