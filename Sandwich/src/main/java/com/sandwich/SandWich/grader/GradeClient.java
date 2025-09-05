package com.sandwich.SandWich.grader;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.grader.dto.GradeRequest;
import com.sandwich.SandWich.grader.dto.GradeResponseEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Qualifier;

import java.net.URI;
import java.time.Instant;

@Slf4j
@Component
public class GradeClient {

    private final RestTemplate rt;
    private final ObjectMapper om;
    private final GraderProperties props;

    public GradeClient(@Qualifier("graderRestTemplate") RestTemplate rt,
                       ObjectMapper om,
                       GraderProperties props) {
        this.rt = rt;
        this.om = om;
        this.props = props;
    }

    public ResponseEntity<String> post(GradeRequest req) {
        URI uri = URI.create(props.getEndpoint());
        String path = uri.getPath();

        try {
            String body = om.writeValueAsString(req);
            String ts = String.valueOf(Instant.now().getEpochSecond());
            String bodySha = HmacSigner.sha256Hex(body);
            String canonical = HmacSigner.canonical("POST", path, ts, bodySha);
            String sig = HmacSigner.hmacBase64(props.getHmacSecret(), canonical);

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("Idempotency-Key", req.requestId());
            h.set("X-Grade-Timestamp", ts);
            h.set("X-Grade-Signature", sig);
            if (props.getKeyId() != null && !props.getKeyId().isBlank()) {
                h.set("X-Grade-KeyId", props.getKeyId());
            }

            HttpEntity<String> http = new HttpEntity<>(body, h);

            int attempt = 0;
            while (true) {
                try {
                    ResponseEntity<String> resp =
                            rt.exchange(uri, HttpMethod.POST, http, String.class);
                    return resp;
                } catch (HttpStatusCodeException e) {
                    int code = e.getRawStatusCode();
                    // 4xx: 재시도 안 함
                    if (code >= 400 && code < 500 && code != 409) {
                        throw e;
                    }
                    // 409: 멱등 충돌(성공 간주 가능) — 그대로 리턴해 상위에서 판단
                    if (code == 409) {
                        return ResponseEntity.status(code).body(e.getResponseBodyAsString());
                    }
                    // 5xx: 재시도
                    if (code >= 500) {
                        if (++attempt > props.getMaxRetries()) throw e;
                        sleepBackoff(attempt);
                        continue;
                    }
                    throw e;
                } catch (ResourceAccessException e) {
                    // 네트워크 예외: 재시도
                    if (++attempt > props.getMaxRetries()) throw e;
                    sleepBackoff(attempt);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("[GRADER] request failed: " + e.getMessage(), e);
        }
    }

    public GradeResponseEnvelope parseBody(String raw) {
        try {
            return om.readValue(raw, GradeResponseEnvelope.class);
        } catch (Exception ignore) { return null; }
    }

    private void sleepBackoff(int attempt) {
        long wait = (long) (props.getBaseBackoffMillis() * Math.pow(2, attempt - 1));
        try { Thread.sleep(wait); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
    }
}