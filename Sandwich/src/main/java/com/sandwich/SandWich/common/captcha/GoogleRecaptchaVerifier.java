package com.sandwich.SandWich.common.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "captcha.enabled", havingValue = "true")
public class GoogleRecaptchaVerifier implements RecaptchaVerifier {

    private final RecaptchaProperties props;
    private final RestTemplate rest = new RestTemplate();

    private RecaptchaResponse call(String token, String secret) {
        var body = new LinkedMultiValueMap<String, String>();
        body.add("secret", secret);
        body.add("response", token);

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        var res = rest.postForEntity(
                "https://www.google.com/recaptcha/api/siteverify",
                new HttpEntity<>(body, headers),
                RecaptchaResponse.class
        );
        return res.getBody();
    }

    private boolean bypassIfTestToken(String token) {
        String bypass = props.getTestBypassToken();
        return bypass != null && !bypass.isBlank() && bypass.equals(token);
    }

    @Override
    public boolean verifyV3(String token, String secret, Double threshold) {
        if (token == null || token.isBlank()) return false;
        if (bypassIfTestToken(token)) return true;

        RecaptchaResponse r = call(token, secret);
        if (r == null || r.success == null || !r.success) return false;

        double th = (threshold != null) ? threshold : 0.0;
        double score = (r.score != null) ? r.score : 0.0;
        return score >= th;
    }

    @Override
    public boolean verifyV2(String token, String secret) {
        if (token == null || token.isBlank()) return false;
        if (bypassIfTestToken(token)) return true;

        RecaptchaResponse r = call(token, secret);
        return r != null && r.success != null && r.success;
    }

    public static class RecaptchaResponse {
        public Boolean success;
        public Double score;        // v3만 채워짐
        public String action;
        public String challenge_ts;
        public String hostname;
        public String[] errorCodes;
    }
}
