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

    @Override
    public boolean verify(String token) {
        if (token == null || token.isBlank()) return false;

        // 로컬/테스트 우회 토큰
        if (props.getTestBypassToken() != null && token.equals(props.getTestBypassToken())) return true;

        var body = new LinkedMultiValueMap<String, String>();
        body.add("secret", props.getSecret());
        body.add("response", token);

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        var res = rest.postForEntity("https://www.google.com/recaptcha/api/siteverify",
                new HttpEntity<>(body, headers), RecaptchaResponse.class);

        var r = res.getBody();
        if (r == null || r.success == null || !r.success) return false;

        if (props.getThreshold() != null && props.getThreshold() > 0 && r.score != null) {
            return r.score >= props.getThreshold();
        }
        return true;
    }

    public static class RecaptchaResponse {
        public Boolean success;
        public Double score;
        public String action;
        public String challenge_ts;
        public String hostname;
        public String[] errorCodes;
    }
}
