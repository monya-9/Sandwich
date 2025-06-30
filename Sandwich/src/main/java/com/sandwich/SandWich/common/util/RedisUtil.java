package com.sandwich.SandWich.common.util;

import com.sandwich.SandWich.global.exception.exceptiontype.RefreshTokenNotFoundException;
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

    public String getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteValue(String key) {
        redisTemplate.delete(key);
    }

}
