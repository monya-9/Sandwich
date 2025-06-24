package com.sandwich.SandWich.common.util;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisUtil {

    private final StringRedisTemplate redisTemplate;

    public void saveRefreshToken(String userId, String refreshToken) {
        String key = "refresh:userId:" + userId;
        redisTemplate.opsForValue().set(key, refreshToken, Duration.ofDays(7));
    }

    public String getRefreshToken(String userId) {
        String key = "refresh:userId:" + userId;
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteRefreshToken(String userId) {
        String key = "refresh:userId:" + userId;
        redisTemplate.delete(key);
    }
}
