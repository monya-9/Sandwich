package com.sandwich.SandWich.common.captcha;

import lombok.Getter; import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "captcha")
public class RecaptchaProperties {
    private boolean enabled = false;   // 기본 비활성
    private String secret;             // 구글 reCAPTCHA 시크릿
    private Double threshold = 0.0;    // v3 점수 임계값(사용 안 하면 0)
    private String paths = "";         // 검사 대상 경로 CSV: "/api/auth/login,/api/auth/signup"
    private String testBypassToken;    // 로컬 우회 토큰 (예: dev-ok)
}
