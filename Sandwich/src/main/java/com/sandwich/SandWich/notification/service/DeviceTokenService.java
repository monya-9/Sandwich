package com.sandwich.SandWich.notification.service;

import com.sandwich.SandWich.notification.domain.DeviceToken;
import com.sandwich.SandWich.notification.dto.PushRegisterRequest;
import com.sandwich.SandWich.notification.repository.DeviceTokenRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class DeviceTokenService {
    private final DeviceTokenRepository repo;

    @Transactional
    public void register(User user, PushRegisterRequest req) {
        var now = OffsetDateTime.now();
        var platform = (req.getPlatform()==null || req.getPlatform().isBlank()) ? "WEB" : req.getPlatform();

        var existing = repo.findByToken(req.getToken()).orElse(null);
        if (existing == null) {
            repo.save(DeviceToken.builder()
                    .user(user)
                    .platform(platform)
                    .token(req.getToken())
                    .isActive(true)
                    .lastSeenAt(now)
                    .build());
        } else {
            existing.setUser(user);          // 토큰 소유자 갱신(브라우저 재로그인 등)
            existing.setPlatform(platform);
            existing.setActive(true);
            existing.setLastSeenAt(now);
        }
    }

    @Transactional
    public void unregister(User user, String token) {
        repo.findByToken(token).ifPresent(dt -> {
            if (!dt.getUser().getId().equals(user.getId())) return; // 내 토큰만
            dt.setActive(false);
            dt.setLastSeenAt(OffsetDateTime.now());
        });
    }
}