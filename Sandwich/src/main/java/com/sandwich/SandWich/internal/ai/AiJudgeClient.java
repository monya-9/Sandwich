package com.sandwich.SandWich.internal.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class AiJudgeClient {

    private final WebClient client;
    private final String baseUrl;
    private final boolean apiKeyPresent;

    // 의존성 optional 주입 (없어도 동작)
    public AiJudgeClient(ObjectProvider<AiApiProps> propsProvider,
                         ObjectProvider<WebClient.Builder> builderProvider) {

        AiApiProps props = propsProvider.getIfAvailable();
        String base = "https://api.dnutzs.org";
        if (props != null && props.base() != null && !props.base().isBlank()) {
            base = props.base();
        }
        this.baseUrl = base;

        WebClient.Builder builder = builderProvider.getIfAvailable();
        if (builder == null) builder = WebClient.builder();

        builder = builder.baseUrl(base);

        boolean hasKey = false;
        if (props != null && props.key() != null && !props.key().isBlank()) {
            hasKey = true;
            builder.defaultHeader("X-AI-API-Key", props.key());
        }
        this.apiKeyPresent = hasKey;

        this.client = builder.build();

        // === 초기화 로그 ===
        log.info("[AiJudgeClient] initialized. baseUrl={}, apiKeyPresent={}, apiKeyLength={}",
                this.baseUrl,
                this.apiKeyPresent,
                (props != null && props.key() != null) ? props.key().length() : 0);
    }

    // 주간 리더보드 조회
    public LeaderboardResp getWeeklyLeaderboard(String week) {
        String path = "/api/reco/judge/leaderboard/{week}";
        log.debug("[AiJudgeClient] GET {} (week={}) baseUrl={}, apiKeyPresent={}",
                path, week, baseUrl, apiKeyPresent);

        try {
            return client.get()
                    .uri(path, week)
                    .exchangeToMono(res -> {
                        var status = res.statusCode();   // HttpStatusCode 타입
                        log.debug("[AiJudgeClient] response status={} for week={}", status, week);

                        if (status.is2xxSuccessful()) {
                            return res.bodyToMono(LeaderboardResp.class)
                                    .doOnNext(body -> log.info(
                                            "[AiJudgeClient] 2xx OK. week={}, leaderboardSize={}",
                                            week,
                                            body != null && body.leaderboard() != null
                                                    ? body.leaderboard().size()
                                                    : null
                                    ));
                        } else {
                            return res.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(body -> {
                                        log.warn("[AiJudgeClient] NON-2xx. week={}, status={}, bodySnippet={}",
                                                week, status, truncate(body));
                                        return res.createException().flatMap(Mono::error);
                                    });
                        }
                    })
                    .doOnError(ex -> log.error(
                            "[AiJudgeClient] exception while calling leaderboard. week={}, baseUrl={}, apiKeyPresent={}",
                            week, baseUrl, apiKeyPresent, ex))
                    .block(Duration.ofSeconds(8));
        } catch (Exception e) {
            log.error("[AiJudgeClient] FAILED to call leaderboard. week={}, baseUrl={}, apiKeyPresent={}",
                    week, baseUrl, apiKeyPresent, e);
            throw e;
        }
    }

    // 개인 결과 조회
    public ResultResp getUserResult(String week, String user) {
        String path = "/api/reco/judge/result/{week}/{user}";
        log.debug("[AiJudgeClient] GET {} (week={}, user={}) baseUrl={}, apiKeyPresent={}",
                path, week, user, baseUrl, apiKeyPresent);

        try {
            return client.get()
                    .uri(path, week, user)
                    .exchangeToMono(res -> {
                        var status = res.statusCode();
                        log.debug("[AiJudgeClient] response status={} for result (week={}, user={})",
                                status, week, user);
                        if (status.is2xxSuccessful()) {
                            return res.bodyToMono(ResultResp.class)
                                    .doOnNext(body -> log.info(
                                            "[AiJudgeClient] 2xx OK result. week={}, user={}, hasResult={}",
                                            week, user, body != null && body.result() != null
                                    ));
                        } else {
                            return res.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(body -> {
                                        log.warn("[AiJudgeClient] NON-2xx result. week={}, user={}, status={}, bodySnippet={}",
                                                week, user, status, truncate(body));
                                        return res.createException().flatMap(Mono::error);
                                    });
                        }
                    })
                    .doOnError(ex -> log.error(
                            "[AiJudgeClient] exception while calling result. week={}, user={}, baseUrl={}, apiKeyPresent={}",
                            week, user, baseUrl, apiKeyPresent, ex))
                    .block(Duration.ofSeconds(8));
        } catch (Exception e) {
            log.error("[AiJudgeClient] FAILED to call result. week={}, user={}, baseUrl={}, apiKeyPresent={}",
                    week, user, baseUrl, apiKeyPresent, e);
            throw e;
        }
    }

    // === DTOs ===
    public record LeaderboardResp(String week, List<Entry> leaderboard) {
        public record Entry(String user, Integer rank, Double score) {}
    }

    public record ResultResp(String week, Result result) {
        public record Result(String user, String message) {}
    }

    // 긴 바디는 잘라서 로그
    private static String truncate(String body) {
        if (body == null) return "";
        int max = 500;
        String trimmed = body.replaceAll("\\s+", " ").trim();
        return (trimmed.length() <= max) ? trimmed : trimmed.substring(0, max) + "...(truncated)";
    }
}

