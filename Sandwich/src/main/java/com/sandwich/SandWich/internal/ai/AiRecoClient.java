package com.sandwich.SandWich.internal.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
public class AiRecoClient {

    private final AiApiProps props;

    private WebClient client() {
        return WebClient.builder()
                .baseUrl(props.base())
                .defaultHeader("X-AI-API-Key", props.key())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
    }

    // 최신 월간
    public MonthlyResp getLatestMonthly() {
        return client().get()
                .uri("/api/reco/monthly")
                .retrieve()
                .bodyToMono(MonthlyResp.class)
                .block();
    }

    // 특정 월간
    public MonthlyResp getMonthly(String ym) {
        return client().get()
                .uri(uri -> uri.path("/api/reco/topics/monthly").queryParam("ym", ym).build())
                .retrieve()
                .bodyToMono(MonthlyResp.class)
                .block();
    }

    // 최신 주간
    public WeeklyResp getLatestWeekly() {
        return client().get()
                .uri("/api/reco/weekly")
                .retrieve()
                .bodyToMono(WeeklyResp.class)
                .block();
    }

    // 특정 주간
    public WeeklyResp getWeekly(String week) {
        return client().get()
                .uri(uri -> uri.path("/api/reco/topics/weekly").queryParam("week", week).build())
                .retrieve()
                .bodyToMono(WeeklyResp.class)
                .block();
    }

    // === 응답 DTO ===
    public record MonthlyResp(String ym, boolean found, Data data) {
        public record Data(
                String title,
                String summary,
                @com.fasterxml.jackson.annotation.JsonAlias({"must","must_have"})
                java.util.List<String> must_have,
                Long updated_at,
                String md // 있어도 되고 없어도 됨 (없으면 null)
        ) {}
    }

    public record WeeklyResp(String week, boolean found, Data data) {
        public record Data(
                String title,
                String summary,
                @com.fasterxml.jackson.annotation.JsonAlias({"must","must_have"})
                java.util.List<String> must_have,
                Long updated_at,
                String md
        ) {}
    }
}