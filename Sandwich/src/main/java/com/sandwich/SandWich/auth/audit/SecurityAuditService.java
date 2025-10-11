package com.sandwich.SandWich.auth.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class SecurityAuditService {
    private final SecurityEventRepository repo;

    @Async
    public void record(String type, Long userId, String email, String pendingId, String details, HttpServletRequest req) {
        SecurityEvent e = SecurityEvent.builder()
                .type(type)
                .userId(userId)
                .email(email)
                .pendingId(pendingId)
                .ip(req != null ? req.getRemoteAddr() : null)
                .ua(req != null ? req.getHeader("User-Agent") : null)
                .details(details)
                .build();
        repo.save(e);
    }
}
