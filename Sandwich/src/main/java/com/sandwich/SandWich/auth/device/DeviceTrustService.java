package com.sandwich.SandWich.auth.device;

import com.sandwich.SandWich.user.domain.User;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import static com.sandwich.SandWich.auth.security.TrustedDeviceFilter.ATTR_TRUSTED;

@Service
@RequiredArgsConstructor
public class DeviceTrustService {
    private final UserDeviceRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom rnd = new SecureRandom();
    private final String cookieDomain = System.getenv().getOrDefault("TRUST_COOKIE_DOMAIN", "");


    public boolean isTrusted(HttpServletRequest req, Long userId) {

        // 필터에서 심어준 trusted attribute가 있으면 먼저 사용
        Object attr = req.getAttribute(ATTR_TRUSTED);
        if (attr instanceof Boolean trustedFlag) {
            return trustedFlag;   // true/false 그대로 반환
        }
        // 기존 로직: 쿠키 → DB 검증
        String tdid = readCookie(req,"tdid");
        String tdt  = readCookie(req,"tdt");
        if (tdid==null || tdt==null) return false;
        return repo.findByDeviceIdAndRevokedAtIsNull(tdid)
                .filter(d -> d.getUserId().equals(userId))
                .filter(d -> d.getTrustUntil()!=null && d.getTrustUntil().isAfter(OffsetDateTime.now()))
                .filter(d -> encoder.matches(tdt, d.getDeviceSecretHash()))
                .isPresent();
    }

    /** 기존 버전(호환용) */
    public void remember(HttpServletRequest req, HttpServletResponse res, Long userId) {
        remember(req, res, userId, null);
    }

    /** 컨트롤러가 호출하는 버전 (deviceName 추가) */
    public void remember(HttpServletRequest req, HttpServletResponse res, Long userId, String deviceName) {
        String existingTdid = readCookie(req,"tdid");
        if (existingTdid != null) {
            var opt = repo.findByDeviceIdAndRevokedAtIsNull(existingTdid);
            if (opt.isPresent() && opt.get().getUserId().equals(userId)) {
                String newSecret = random(32);
                UserDevice d = opt.get();
                d.setDeviceSecretHash(encoder.encode(newSecret));
                d.setDeviceName(deviceName);
                d.setLastIp(clientIp(req));
                d.setTrustUntil(OffsetDateTime.now().plus(30, ChronoUnit.DAYS));
                repo.save(d);
                addCookie(res,"tdt", newSecret, 30*24*3600);
                return;
            }
        }


        String deviceId = random(24);
        String secret   = random(32);
        String uaHash = Integer.toHexString(String.valueOf(req.getHeader("User-Agent")).hashCode());
        String ip = req.getRemoteAddr();
        System.out.println("### [TRUST] remember() enter userId=" + userId + " deviceId=" + deviceId + " ip=" + ip + " uaHash=" + uaHash + " deviceName=" + deviceName);

        var e = UserDevice.builder()
                .userId(userId)
                .deviceId(deviceId)
                .deviceSecretHash(encoder.encode(secret))
                .uaHash(uaHash)
                .lastIp(ip)
                .deviceName(deviceName)
                .trustUntil(OffsetDateTime.now().plus(30, ChronoUnit.DAYS))
                .build();

        repo.save(e);
        System.out.println("### [TRUST] saved row id=" + e.getId());

        addCookie(res,"tdid",deviceId,30*24*3600);
        addCookie(res,"tdt", secret, 30*24*3600);
        System.out.println("### [TRUST] cookies set tdid/tdt");
    }
    private final String sameSite = System.getenv().getOrDefault("TRUST_COOKIE_SAMESITE", "None");
    private final boolean secure  = Boolean.parseBoolean(System.getenv().getOrDefault("TRUST_COOKIE_SECURE", "true"));

    private void addCookie(HttpServletResponse res, String n, String v, int maxAge) {
        Cookie c = new Cookie(n, v);
        c.setHttpOnly(true);
        c.setSecure(secure);
        c.setPath("/");
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            c.setDomain(cookieDomain);
        }
        c.setMaxAge(maxAge);
        c.setAttribute("SameSite", sameSite);
        res.addCookie(c);
    }

    @Transactional
    public void extendCurrentDevice(HttpServletRequest req, Long userId, int days) {
        String tdid = readCookie(req, "tdid");
        if (tdid == null) return;
        repo.findByDeviceIdAndRevokedAtIsNull(tdid).ifPresent(d -> {
            if (d.getUserId().equals(userId)) {
                d.setTrustUntil(OffsetDateTime.now().plus(days, ChronoUnit.DAYS));
                repo.save(d);
            }
        });
    }

    private String readCookie(HttpServletRequest req, String k){
        if (req.getCookies()==null) return null;
        for (Cookie c: req.getCookies()) if (k.equals(c.getName())) return c.getValue();
        return null;
    }
    private String random(int bytes){
        byte[] b=new byte[bytes]; rnd.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    public boolean isTrusted(HttpServletRequest req) {
        String tdid = readCookie(req,"tdid");
        String tdt  = readCookie(req,"tdt");
        if (tdid==null || tdt==null) return false;
        String ua = String.valueOf(req.getHeader("User-Agent"));
        String ip = clientIp(req);
        return isTrusted(tdid, tdt, ua, ip);
    }

    //전역 필터용: userId 없이 디바이스 자체가 유효/미해지/미만료이고, 비밀이 맞는지만 검사
    public boolean isTrusted(String deviceId, String deviceToken, String userAgent, String ip) {
        return repo.findByDeviceIdAndRevokedAtIsNull(deviceId)
                .filter(d -> d.getTrustUntil()!=null && d.getTrustUntil().isAfter(OffsetDateTime.now()))
                .filter(d -> encoder.matches(deviceToken, d.getDeviceSecretHash()))
                .isPresent();
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return req.getRemoteAddr();
    }

    // === revoke 단건 ===
    @Transactional
    public void revokeById(Long userId, Long deviceRowId) {
        var dev = repo.findByIdAndUserId(deviceRowId, userId)
                .orElseThrow(() -> new IllegalArgumentException("DEVICE_NOT_FOUND"));
        if (dev.getRevokedAt() == null) dev.setRevokedAt(OffsetDateTime.now());
        repo.save(dev);
    }

    // === revoke 전체 ===
    @Transactional
    public int revokeAll(Long userId) {
        return repo.revokeAllActiveByUserId(userId, OffsetDateTime.now());
    }

    // === 쿠키 기반(현재 브라우저) ===
    @Transactional
    public void revokeByCookies(HttpServletRequest req, Long userId) {
        String tdid = readCookie(req, "tdid");
        if (tdid == null) throw new IllegalArgumentException("COOKIE_NOT_FOUND");
        var dev = repo.findByDeviceIdAndRevokedAtIsNull(tdid)
                .orElseThrow(() -> new IllegalArgumentException("DEVICE_NOT_FOUND"));
        if (!dev.getUserId().equals(userId)) throw new SecurityException("FORBIDDEN");
        dev.setRevokedAt(OffsetDateTime.now());
        repo.save(dev);
    }

    // === 쿠키 제거 유틸 ===
    public void clearTrustCookies(HttpServletResponse res) {
        killCookie(res, "tdid");
        killCookie(res, "tdt");
    }

    private void killCookie(HttpServletResponse res, String name) {
        Cookie c = new Cookie(name, "");
        c.setPath("/");
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            c.setDomain(cookieDomain);
        }
        c.setMaxAge(0);
        c.setHttpOnly(true);
        c.setSecure(secure);
        c.setAttribute("SameSite", sameSite);
        res.addCookie(c);
    }

}