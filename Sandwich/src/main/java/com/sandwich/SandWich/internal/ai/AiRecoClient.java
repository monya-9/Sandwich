package com.sandwich.SandWich.internal.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiRecoClient {

    private final AiApiProps props;

    private WebClient client() {
        boolean apiKeyPresent = props != null && props.key() != null && !props.key().isBlank();
        String base = (props != null && props.base() != null && !props.base().isBlank())
                ? props.base()
                : "https://api.dnutzs.org";

        log.debug("[AiRecoClient] building WebClient. baseUrl={}, apiKeyPresent={}, apiKeyLength={}",
                base, apiKeyPresent,
                (props != null && props.key() != null) ? props.key().length() : 0);

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(base)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json");

        if (apiKeyPresent) {
            builder.defaultHeader("X-AI-API-Key", props.key());
        }

        return builder.build();
    }

    // === 공통 helper: GET + 강한 로그 ===
    private <T> T getWithLog(String pathDescription,
                             String uriString,
                             Class<T> bodyType) {

        WebClient c = client(); // 매번 새로 만들지만, 지금 구조 유지

        log.debug("[AiRecoClient] GET {} -> {}", pathDescription, uriString);

        try {
            return c.get()
                    .uri(uriString)
                    .exchangeToMono(res -> {
                        var status = res.statusCode();  // HttpStatusCode
                        log.debug("[AiRecoClient] response status={} for {}", status, pathDescription);

                        if (status.is2xxSuccessful()) {
                            return res.bodyToMono(bodyType)
                                    .doOnNext(body -> log.info(
                                            "[AiRecoClient] 2xx OK. path={}, status={}, bodyClass={}",
                                            pathDescription, status, bodyType.getSimpleName()
                                    ));
                        } else {
                            return res.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(body -> {
                                        log.warn("[AiRecoClient] NON-2xx. path={}, status={}, bodySnippet={}",
                                                pathDescription, status, truncate(body));
                                        return res.createException().flatMap(Mono::error);
                                    });
                        }
                    })
                    .doOnError(ex -> log.error(
                            "[AiRecoClient] exception while calling {} uri={}",
                            pathDescription, uriString, ex))
                    .block();
        } catch (Exception e) {
            log.error("[AiRecoClient] FAILED call. path={}, uri={}", pathDescription, uriString, e);
            throw e;
        }
    }


    // 최신 월간
    public MonthlyResp getLatestMonthly() {
        return getWithLog("getLatestMonthly", "/api/reco/monthly", MonthlyResp.class);
    }

    // 특정 월간
    public MonthlyResp getMonthly(String ym) {
        String uri = "/api/reco/topics/monthly?ym=" + ym;
        return getWithLog("getMonthly(ym=" + ym + ")", uri, MonthlyResp.class);
    }

    // 최신 주간
    public WeeklyResp getLatestWeekly() {
        return getWithLog("getLatestWeekly", "/api/reco/weekly", WeeklyResp.class);
    }

    // 특정 주간
    public WeeklyResp getWeekly(String week) {
        String uri = "/api/reco/topics/weekly?week=" + week;
        return getWithLog("getWeekly(week=" + week + ")", uri, WeeklyResp.class);
    }

    public TopWeekResp getTopWeekRanking() {
        return getWithLog("getTopWeekRanking", "/api/reco/top/week", TopWeekResp.class);
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

    public record TopWeekResp(String week, Integer total, java.util.List<Item> data) {
        public record Item(
                @com.fasterxml.jackson.annotation.JsonAlias({"project_id","projectId"})
                Long projectId,
                Double score
        ) {}
    }

    private static String truncate(String body) {
        if (body == null) return "";
        int max = 500;
        String trimmed = body.replaceAll("\\s+", " ").trim();
        return (trimmed.length() <= max) ? trimmed : trimmed.substring(0, max) + "...(truncated)";
    }
}
