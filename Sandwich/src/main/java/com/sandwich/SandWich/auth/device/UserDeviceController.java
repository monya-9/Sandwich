package com.sandwich.SandWich.auth.device;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/devices")
public class UserDeviceController {

    private final DeviceTrustService trust;
    private final UserDeviceRepository repo;

    /** 내 활성 디바이스 목록 */
    @GetMapping
    public List<UserDeviceDto> myDevices(
            @AuthenticationPrincipal(expression = "id") Long userId) {
        return repo.findByUserIdAndRevokedAtIsNull(userId)
                .stream().map(UserDeviceDto::from).toList();
    }

    @GetMapping("/trust-check")
    public Map<String, Object> trustCheck(
            HttpServletRequest req,
            @AuthenticationPrincipal(expression = "id") Long userId
    ) {
        boolean trustedForUser    = trust.isTrusted(req, userId);
        boolean trustedDeviceOnly = trust.isTrusted(req);

        String tdid = null, tdt = null;
        if (req.getCookies() != null) {
            for (var c : req.getCookies()) {
                if ("tdid".equals(c.getName())) tdid = c.getValue();
                if ("tdt".equals(c.getName()))  tdt  = c.getValue();
            }
        }

        Long deviceOwnerId = (tdid == null) ? null :
                repo.findByDeviceIdAndRevokedAtIsNull(tdid)
                        .map(UserDevice::getUserId)
                        .orElse(null);

        return Map.of(
                "userId", userId,
                "hasTdidCookie", tdid != null,
                "hasTdtCookie",  tdt  != null,
                "deviceOwnerId", deviceOwnerId,
                "trustedDeviceOnly", trustedDeviceOnly,
                "trustedForUser",   trustedForUser
        );
    }

    /** 특정 디바이스 무효화(내 계정 소유) */
    @DeleteMapping("/{deviceRowId}")
    public ResponseEntity<?> revokeOne(@PathVariable Long deviceRowId,
                                       @AuthenticationPrincipal(expression = "id") Long userId) {
        trust.revokeById(userId, deviceRowId);
        return ResponseEntity.noContent().build();
    }

    /** 내 모든 디바이스 무효화(+쿠키 제거) */
    @PostMapping("/revoke-all")
    public Map<String, Object> revokeAll(
            @AuthenticationPrincipal(expression = "id") Long userId,
            HttpServletResponse res) {
        int n = trust.revokeAll(userId);
        trust.clearTrustCookies(res);
        return Map.of("revoked", n);
    }

    /** 내 현재 브라우저 디바이스만 무효화(+쿠키 제거) */
    @PostMapping("/revoke-current")
    public ResponseEntity<?> revokeCurrent(
            @AuthenticationPrincipal(expression = "id") Long userId,
            HttpServletRequest req, HttpServletResponse res) {
        trust.revokeByCookies(req, userId);
        trust.clearTrustCookies(res);
        return ResponseEntity.noContent().build();
    }

    // DTO
    public record UserDeviceDto(Long id, String deviceId, String deviceName,
                                String lastIp, String uaHash, Instant trustUntil) {
        static UserDeviceDto from(UserDevice d) {
            return new UserDeviceDto(
                    d.getId(),
                    d.getDeviceId(),
                    d.getDeviceName(),
                    d.getLastIp(),
                    d.getUaHash(),
                    d.getTrustUntil() == null ? null : d.getTrustUntil().toInstant()
            );
        }
    }
}
