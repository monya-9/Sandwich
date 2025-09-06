package com.sandwich.SandWich.grader;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "grader")
public class GraderProperties {
    private boolean enabled = false;
    private String endpoint;
    private String hmacSecret;
    private String keyId;
    private String callbackUrl;

    // 타임아웃(ms)
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 10000;

    // 재시도/백오프(GradeClient가 사용)
    private int maxRetries = 3;
    private long baseBackoffMillis = 300;

    private boolean callbackEnabled = true;
    private int clockSkewSeconds = 300;
}
