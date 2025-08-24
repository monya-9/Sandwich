package com.sandwich.SandWich.config;

import com.microsoft.playwright.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PlaywrightConfig {

    @Bean(destroyMethod = "close")
    public Playwright playwright() {
        return Playwright.create();
    }

    @Bean(destroyMethod = "close")
    public Browser browser(Playwright playwright) {
        // 필요하면 .setArgs(List.of("--disable-gpu")) 등 추가 가능
        return playwright.chromium()
                .launch(new BrowserType.LaunchOptions().setHeadless(true));
    }
}