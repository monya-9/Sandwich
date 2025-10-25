package com.sandwich.SandWich.common.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    // 필요한 캐시 이름을 등록 (예: hotDevelopers)
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("hotDevelopers");
    }
}
