package com.sandwich.SandWich.common.captcha;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "captcha.enabled", havingValue = "false", matchIfMissing = true)
public class NoopRecaptchaVerifier implements RecaptchaVerifier {
    @Override public boolean verify(String token) { return true; }
}