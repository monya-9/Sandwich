package com.sandwich.SandWich.auth.mfa;

import com.sandwich.SandWich.auth.device.DeviceTrustService;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.email.service.LoginOtpMailService;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/otp")
public class OtpController {

    private final OtpService otpService;
    private final JwtUtil jwt;
    private final RedisUtil redisUtil;
    private final UserRepository userRepository;
    private final DeviceTrustService deviceTrustService;
    private final LoginOtpMailService loginOtpMailService;
    private final StringRedisTemplate redis; // 재전송 rate-limit에 사용

    /* ======================
       B2) OTP 검증
       ====================== */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyReq req,
                                    HttpServletRequest httpReq,
                                    HttpServletResponse httpRes) {

        String pendingId = req.getPendingId() == null ? null : req.getPendingId().trim();
        String code = req.getCode() == null ? "" : req.getCode().trim();

        var result = otpService.verifyDetailed(pendingId, code, 5);

        switch (result) {
            case OK -> {
                // 컨텍스트는 pop해 한 번 쓰고 지움
                OtpContext ctx = otpService.popContext(pendingId);
                if (ctx == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "EXPIRED"));
                }

                User user = userRepository.findByEmailAndIsDeletedFalse(ctx.getEmail())
                        .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

                String accessToken  = jwt.createAccessToken(user.getEmail(), user.getRole().name());
                String refreshToken = jwt.createRefreshToken(user.getEmail());
                redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

                if (Boolean.TRUE.equals(req.getRememberDevice())) {
                    String deviceName = (req.getDeviceName() == null || req.getDeviceName().isBlank())
                            ? "Unnamed Device" : req.getDeviceName().trim();
                    deviceTrustService.remember(httpReq, httpRes, user.getId(), deviceName);
                }

                return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken, user.getProvider()));
            }
            case INVALID -> { return ResponseEntity.badRequest().body(Map.of("error", "INVALID_CODE")); }
            case EXPIRED -> { return ResponseEntity.badRequest().body(Map.of("error", "EXPIRED")); }
            case LOCKED  -> { return ResponseEntity.status(423).body(Map.of("error", "LOCKED")); }
        }
        return ResponseEntity.badRequest().body(Map.of("error", "UNKNOWN"));
    }

    /* ======================
       B1) OTP 재전송
       ====================== */
    @PostMapping("/resend")
    public ResponseEntity<?> resend(@RequestBody ResendReq req) {
        String pendingId = req.getPendingId() == null ? null : req.getPendingId().trim();
        if (pendingId == null || pendingId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "EXPIRED"));
        }

        // 1) 컨텍스트 존재 확인
        OtpContext ctx = otpService.loadContext(pendingId);
        if (ctx == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "EXPIRED"));
        }

        // 2) 쿨다운 체크 (60초)
        String coolKey = "otp:rs:cool:" + pendingId;
        Long coolTtl = redis.getExpire(coolKey, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(redis.hasKey(coolKey)) && (coolTtl == null || coolTtl > 0)) {
            return ResponseEntity.status(429).body(Map.of("error", "COOLDOWN"));
        }

        // 3) 일일 횟수 제한 (기본 10회)
        String dayKey = "otp:rs:day:" + ctx.getEmail();
        Long cnt = redis.opsForValue().increment(dayKey);
        if (cnt != null && cnt == 1L) {
            // 자정까지 TTL
            long ttl = secondsUntilMidnight();
            redis.expire(dayKey, ttl, TimeUnit.SECONDS);
        }
        if (cnt != null && cnt > 10) {
            return ResponseEntity.status(429).body(Map.of("error", "DAILY_LIMIT"));
        }

        // 4) 새 코드 발급 + 메일 재전송
        String code = otpService.issueCode(pendingId);
        loginOtpMailService.sendLoginOtp(ctx.getEmail(), code);

        // 5) 쿨다운 arm
        redis.opsForValue().set(coolKey, "1");
        redis.expire(coolKey, 60, TimeUnit.SECONDS);

        // 6) 본문 없음(204) 권장
        return ResponseEntity.noContent().build();
    }

    private long secondsUntilMidnight() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime midnight = now.plusDays(1).toLocalDate().atStartOfDay();
        return Math.max(1, ChronoUnit.SECONDS.between(now, midnight));
    }

    /* === DTOs === */
    @Data
    public static class VerifyReq {
        private String pendingId;
        private String code;
        private Boolean rememberDevice;
        private String deviceName;
    }

    @Data
    public static class ResendReq {
        private String pendingId;
    }
}
