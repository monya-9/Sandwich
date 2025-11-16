package com.sandwich.SandWich.internal.ai;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Component
public class AiJudgeClient {

    private final WebClient client;

    // 의존성 optional 주입 (없어도 동작)
    public AiJudgeClient(ObjectProvider<AiApiProps> propsProvider,
                         ObjectProvider<WebClient.Builder> builderProvider) {

        String base = "https://api.dnutzs.org";
        AiApiProps props = propsProvider.getIfAvailable();
        if (props != null && props.base() != null && !props.base().isBlank()) {
            base = props.base();
        }

        WebClient.Builder builder = builderProvider.getIfAvailable();
        if (builder == null) builder = WebClient.builder();

        this.client = builder.baseUrl(base).build();
    }

    // 주간 리더보드 조회
    public LeaderboardResp getWeeklyLeaderboard(String week) {
        return client.get()
                .uri("/api/reco/judge/leaderboard/{week}", week)
                .exchangeToMono(res -> {
                    if (res.statusCode().is2xxSuccessful()) {
                        return res.bodyToMono(LeaderboardResp.class);
                    } else if (res.statusCode().value() == 404) {
                        return Mono.empty(); // block() => null
                    } else {
                        return res.createException().flatMap(Mono::error);
                    }
                })
                .block(Duration.ofSeconds(8));
    }

    // 개인 결과 조회
    public ResultResp getUserResult(String week, String user) {
        return client.get()
                .uri("/api/reco/judge/result/{week}/{user}", week, user)
                .exchangeToMono(res -> {
                    if (res.statusCode().is2xxSuccessful()) {
                        return res.bodyToMono(ResultResp.class);
                    } else if (res.statusCode().value() == 404) {
                        return Mono.empty();
                    } else {
                        return res.createException().flatMap(Mono::error);
                    }
                })
                .block(Duration.ofSeconds(8));
    }

    // === DTOs ===
    public record LeaderboardResp(String week, List<Entry> leaderboard) {
        public record Entry(String user, Integer rank, Double score) {}
    }

    public record ResultResp(String week, Result result) {
        public record Result(String user, String message) {}
    }
}
