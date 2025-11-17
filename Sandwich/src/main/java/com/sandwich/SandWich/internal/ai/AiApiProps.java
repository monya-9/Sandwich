package com.sandwich.SandWich.internal.ai;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Slf4j
@ConfigurationProperties(prefix = "ai.api")
public record AiApiProps(String base, String key, String recoTopWeekPath) {

    @PostConstruct
    public void init() {
        log.info("[AiApiProps] loaded. base={}, keyPresent={}, keyLength={}, recoTopWeekPath={}",
                base,
                key != null && !key.isBlank(),
                key != null ? key.length() : 0,
                recoTopWeekPath
        );
    }
}