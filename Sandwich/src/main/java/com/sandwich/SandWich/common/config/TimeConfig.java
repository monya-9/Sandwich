package com.sandwich.SandWich.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class TimeConfig {

    @Bean
    public Clock clock() {
        // 항상 UTC 기준으로
        return Clock.systemUTC();
    }
}