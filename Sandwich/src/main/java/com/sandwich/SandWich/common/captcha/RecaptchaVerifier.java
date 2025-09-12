package com.sandwich.SandWich.common.captcha;

public interface RecaptchaVerifier {
    boolean verifyV3(String token, String secret, Double threshold);
    boolean verifyV2(String token, String secret);
}