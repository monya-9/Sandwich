package com.sandwich.SandWich.grader;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class HmacVerifier {

    private final GraderProperties props;
    private final ObjectMapper om;

    public void verify(String method, String path, String timestamp, String body, String signature, String keyId) {
        // 1) 시간 편차 검증
        long now = Instant.now().getEpochSecond();
        long ts = Long.parseLong(timestamp);
        if (Math.abs(now - ts) > props.getClockSkewSeconds()) {
            throw new IllegalStateException("timestamp_skew");
        }

        // (선택) keyId 확인: 환경 분리용
        if (props.getKeyId() != null && keyId != null && !props.getKeyId().equals(keyId)) {
            throw new IllegalStateException("key_mismatch");
        }

        // 2) canonical 생성 + HMAC
        String sha = HmacSigner.sha256Hex(body == null ? "" : body);
        String canonical = HmacSigner.canonical(method, path, timestamp, sha);
        String expected = HmacSigner.hmacBase64(props.getHmacSecret(), canonical);

        if (!expected.equals(signature)) {
            throw new IllegalStateException("signature_mismatch");
        }
    }

    /** 콜백용 path 추출 헬퍼 */
    public static String pathOnly(String fullUrl) {
        return URI.create(fullUrl).getPath(); // 쿼리 제외
    }
}