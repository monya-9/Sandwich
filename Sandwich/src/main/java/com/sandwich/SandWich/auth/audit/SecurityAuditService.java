package com.sandwich.SandWich.auth.audit;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
public class SecurityAuditService {
    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);
    private final SecurityEventRepository repo;

    /** 호출 스레드에서 안전하게 ip/ua를 추출하고 값만 비동기로 넘깁니다. */
    public void record(String type, Long userId, String email, String pendingId,
                       String details, HttpServletRequest req) {

        String ip = null, ua = null;
        if (req != null) {
            try { ip = req.getRemoteAddr(); } catch (Exception ignored) {}
            try { ua = req.getHeader("User-Agent"); } catch (Exception ignored) {}
        }
        doRecordAsync(type, userId, email, pendingId, details, ip, ua);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doRecordAsync(String type, Long userId, String email, String pendingId,
                              String details, String ip, String ua) {
        try {
            SecurityEvent e = SecurityEvent.builder()
                    .type(type)
                    .userId(userId)
                    .email(email)
                    .pendingId(pendingId)
                    .ip(ip)
                    .ua(ua)
                    .details(details)
                    .build();
            repo.save(e);
        } catch (Exception ex) {
            log.warn("audit.record fail type={} pid={} msg={}", type, pendingId, ex.getMessage());
        }
    }
}
