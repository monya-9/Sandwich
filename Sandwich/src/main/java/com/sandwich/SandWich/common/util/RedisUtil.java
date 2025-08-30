package com.sandwich.SandWich.common.util;

import com.sandwich.SandWich.common.exception.exceptiontype.RefreshTokenNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisUtil {

    private final StringRedisTemplate redisTemplate;

    // ======= Refresh Token =======

    public void saveRefreshToken(String userId, String refreshToken) {
        String key = "refresh:userId:" + userId;
        redisTemplate.opsForValue().set(key, refreshToken, Duration.ofDays(7));
    }

    public String getRefreshToken(String userId) {
        String key = "refresh:userId:" + userId;
        String token = redisTemplate.opsForValue().get(key);
        if (token == null) {
            throw new RefreshTokenNotFoundException();
        }
        return token;
    }

    public void deleteRefreshToken(String userId) {
        String key = "refresh:userId:" + userId;
        redisTemplate.delete(key);
    }

    // ======= 공통 키 관리 =======

    public String getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteValue(String key) {
        redisTemplate.delete(key);
    }

    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    // TTL 키 전용 → 중복방지 전용 키일 때만 사용!
    public void setDuplicateTTLKey(String key, long duration, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, "1");
        redisTemplate.expire(key, duration, unit);
    }

    // ======= 조회수 처리 =======

    public void incrementViewCount(String key) {
        redisTemplate.opsForValue().increment(key);
    }

    public Long getViewCount(String key) {
        String value = redisTemplate.opsForValue().get(key);
        return value != null ? Long.parseLong(value) : 0L;
    }

    public void setViewCount(String key, Long value) {
        redisTemplate.opsForValue().set(key, value.toString());
    }

}
