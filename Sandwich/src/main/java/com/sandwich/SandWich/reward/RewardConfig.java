package com.sandwich.SandWich.reward;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        RewardProperties.class,
        RewardAutoPublishProperties.class
})
public class RewardConfig {}