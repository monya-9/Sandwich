package com.sandwich.SandWich.common.captcha;

public interface RecaptchaVerifier {
    boolean verify(String token);
}