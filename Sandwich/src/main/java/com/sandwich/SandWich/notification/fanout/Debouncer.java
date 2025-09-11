package com.sandwich.SandWich.notification.fanout;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class Debouncer {

    private final Map<String, Instant> lastMap = new ConcurrentHashMap<>();

    /**
     * 특정 key에 대해 gap 시간 이상 지났을 때만 true 리턴
     */
    public boolean allow(String key, Duration gap) {
        Instant now = Instant.now();
        Instant last = lastMap.get(key);
        if (last != null && Duration.between(last, now).compareTo(gap) < 0) {
            return false; // 아직 쿨타임 안 됨
        }
        lastMap.put(key, now);
        return true;
    }
}