package com.sandwich.SandWich.message.ws;

import lombok.Getter;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// email -> set of destinations
@Component
public class SubscriptionRegistry {
    @Getter
    private final Map<String, Set<String>> userSubs = new ConcurrentHashMap<>();

    public void add(String email, String dest) {
        if (email == null || dest == null) return;
        userSubs.computeIfAbsent(email, k -> ConcurrentHashMap.newKeySet()).add(dest);
    }

    public void remove(String email, String dest) {
        if (email == null || dest == null) return;
        var set = userSubs.get(email);
        if (set != null) {
            set.remove(dest);
            if (set.isEmpty()) userSubs.remove(email);
        }
    }
    // 세션 종료/비정상 종료 시 해당 사용자의 구독을 한 번에 정리
    public void clearFor(String email) {
        if (email == null) return;
        userSubs.remove(email);
        System.out.println("[WS][SUBS] cleared all subscriptions for " + email);
    }

    public boolean isSubscribed(String email, String destPrefix) {
        var set = userSubs.get(email);
        if (set == null) return false;
        for (String d : set) if (d.startsWith(destPrefix)) return true;
        return false;
    }
}