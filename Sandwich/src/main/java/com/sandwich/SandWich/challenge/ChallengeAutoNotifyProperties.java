package com.sandwich.SandWich.challenge;

import lombok.Getter; import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "challenge.auto-notify")
public class ChallengeAutoNotifyProperties {
    private boolean enabled = true;
}