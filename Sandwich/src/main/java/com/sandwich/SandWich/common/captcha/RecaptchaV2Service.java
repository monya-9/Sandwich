package com.sandwich.SandWich.common.captcha;

import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class RecaptchaV2Service {

    @Value("${captcha.v2.enabled:false}") private boolean enabled;
    @Value("${captcha.v2.secret:}")       private String secret;
    @Value("${captcha.testBypassToken:}") private String testBypassToken;

    private final RestTemplate rest = new RestTemplate();

    public void verifyOrThrow(String token) {
        if (!enabled) return; // 끔 상태면 통과
        if (token == null || token.isBlank())
            throw new BadRequestException("RECAPTCHA_FAIL", "reCAPTCHA 검증 실패");

        if (testBypassToken != null && token.equals(testBypassToken)) return;

        var body = new LinkedMultiValueMap<String, String>();
        body.add("secret", secret);
        body.add("response", token);

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        var res = rest.postForEntity(
                "https://www.google.com/recaptcha/api/siteverify",
                new HttpEntity<>(body, headers),
                RecaptchaV2Response.class
        );
        var r = res.getBody();
        if (r == null || r.success == null || !r.success) {
            throw new BadRequestException("RECAPTCHA_FAIL", "reCAPTCHA 검증 실패");
        }
    }

    @Data
    public static class RecaptchaV2Response {
        private Boolean success;
        private String challenge_ts;
        private String hostname;
        private String[] errorCodes;
    }

    private void assertValid(RecaptchaV2Response r) {
        log.info("[reCAPTCHA v2] success={}, host={}, errors={}", r.getSuccess(), r.getHostname(), r.getErrorCodes());
        if (!r.getSuccess()) throw new BadRequestException("RECAPTCHA_FAIL");
    }
}
