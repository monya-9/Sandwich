package com.sandwich.SandWich.challenge.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "challenge.scheduler.enabled", havingValue = "true", matchIfMissing = true)
class ChallengeSchedulerConfig { }