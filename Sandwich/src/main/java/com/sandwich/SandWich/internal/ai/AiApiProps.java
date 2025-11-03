package com.sandwich.SandWich.internal.ai;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.api")
public record AiApiProps(String base, String key, String recoTopWeekPath) {}