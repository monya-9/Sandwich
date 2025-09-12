package com.sandwich.SandWich.common.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "ratelimit")
public class RateLimitProperties {
    private boolean enabled = true;

    @Getter @Setter
    public static class Rule {
        private int perMin = 3;
        private int perDay = 50;
    }

    private Rule submission = new Rule();
    private Rule vote = new Rule();
}