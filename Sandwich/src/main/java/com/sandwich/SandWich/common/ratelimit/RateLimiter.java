package com.sandwich.SandWich.common.ratelimit;


import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class RateLimiter {

    private final StringRedisTemplate redis;

    public boolean tryConsume(String bucketKey, int limit, Duration window) {
        String key = "rl:" + bucketKey;
        Long v = redis.opsForValue().increment(key);
        if (v != null && v == 1L) {
            redis.expire(key, window); // 첫 증가 시 TTL 설정
        }
        return v != null && v <= limit;
    }

    // userId 있으면 USER 기준, 없으면 IP 기준
    public static String bucket(HttpServletRequest req, Long userId, String route, String granularity) {
        String who = (userId != null) ? ("u:" + userId) : ("ip:" + clientIp(req));
        String ts = switch (granularity) {
            case "min" -> DateTimeFormatter.ofPattern("yyyyMMddHHmm").format(LocalDateTime.now());
            case "day" -> DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
            default -> "raw";
        };
        return route + ":" + who + ":" + ts;
    }

    private static String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}