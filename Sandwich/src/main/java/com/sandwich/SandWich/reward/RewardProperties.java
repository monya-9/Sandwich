package com.sandwich.SandWich.reward;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "reward")
public class RewardProperties {
    private boolean enabled = true;
    private boolean applyCredits = true;
}