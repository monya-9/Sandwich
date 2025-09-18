package com.sandwich.SandWich.message.screenshot.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Component
@ConfigurationProperties(prefix = "app.screenshot")
public class ScreenshotProperties {
    /** 한 번에 렌더할 최대 메시지 수 (과도 요청 가드) */
    private int maxCount = 200;

    /** Playwright 페이지 타임아웃(ms) */
    private int timeoutMs = 15000;

    public void setMaxCount(int maxCount) { this.maxCount = maxCount; }
    public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
}