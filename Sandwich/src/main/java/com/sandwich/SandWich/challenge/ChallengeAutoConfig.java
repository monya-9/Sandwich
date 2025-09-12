package com.sandwich.SandWich.challenge;

import com.sandwich.SandWich.reward.RewardAutoPublishProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({ChallengeAutoNotifyProperties.class, RewardAutoPublishProperties.class})
public class ChallengeAutoConfig { }