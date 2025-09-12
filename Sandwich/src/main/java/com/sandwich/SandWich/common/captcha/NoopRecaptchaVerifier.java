package com.sandwich.SandWich.common.captcha;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "captcha.enabled", havingValue = "false", matchIfMissing = true)
public class NoopRecaptchaVerifier implements RecaptchaVerifier {
    @Override public boolean verifyV3(String token, String secret, Double threshold) { return true; }
    @Override public boolean verifyV2(String token, String secret) { return true; }
}