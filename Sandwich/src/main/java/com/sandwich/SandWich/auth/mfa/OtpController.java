package com.sandwich.SandWich.auth.mfa;

import com.sandwich.SandWich.auth.device.DeviceTrustService;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/otp")
public class OtpController {

    private final OtpService otpService;
    private final JwtUtil jwt;
    private final RedisUtil redisUtil;
    private final UserRepository userRepository;
    private final DeviceTrustService deviceTrustService; // 이미 프로젝트에 있는 서비스

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyReq req,
                                    HttpServletRequest httpReq,
                                    HttpServletResponse httpRes) {

        String pendingId = req.getPendingId();
        if (pendingId != null) pendingId = pendingId.trim();
        String code = (req.getCode() == null) ? "" : req.getCode().trim();

        // 상세 검증 (OK/INVALID/EXPIRED/LOCKED)
        var result = otpService.verifyDetailed(pendingId, code, 5);

        switch (result) {
            case OK -> {
                OtpContext ctx = otpService.popContext(pendingId); // ← 여기!
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

            case INVALID -> {
                return ResponseEntity.badRequest().body(Map.of("error", "INVALID_CODE"));
            }
            case EXPIRED -> {
                return ResponseEntity.badRequest().body(Map.of("error", "EXPIRED"));
            }
            case LOCKED -> {
                return ResponseEntity.status(423).body(Map.of("error", "LOCKED"));
            }
        }
        return ResponseEntity.badRequest().body(Map.of("error", "UNKNOWN"));
    }

    // === DTO ===
    @Data
    public static class VerifyReq {
        private String pendingId;       // 반드시 String (선행 0 보존)
        private String code;            // 반드시 String (선행 0 보존)
        private Boolean rememberDevice; // optional
        private String deviceName;      // optional
    }
}
