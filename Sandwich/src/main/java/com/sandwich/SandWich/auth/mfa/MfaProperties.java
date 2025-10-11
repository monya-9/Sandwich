package com.sandwich.SandWich.auth.mfa;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "mfa")
public class MfaProperties {
    //true: 로그인 시 2FA 동작 / false: 2FA 비활성화(항상 즉시 JWT 발급)
    private boolean enabled = true;

    //true: /api/auth/otp/* API 자체를 404로 막는 긴급 스위치
    private boolean blockOtpApis = false;
}
