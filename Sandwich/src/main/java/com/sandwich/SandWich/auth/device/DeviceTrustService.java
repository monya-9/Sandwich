package com.sandwich.SandWich.auth.device;

import com.sandwich.SandWich.user.domain.User;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class DeviceTrustService {
    private final UserDeviceRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom rnd = new SecureRandom();

    public boolean isTrusted(HttpServletRequest req, Long userId) {
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
        String deviceId = random(24);
        String secret   = random(32);
        var e = UserDevice.builder()
                .userId(userId)
                .deviceId(deviceId)
                .deviceSecretHash(encoder.encode(secret))
                .uaHash(Integer.toHexString(String.valueOf(req.getHeader("User-Agent")).hashCode()))
                .lastIp(req.getRemoteAddr())
                .deviceName(deviceName) // 엔티티에 컬럼 추가한 경우
                .trustUntil(OffsetDateTime.now().plus(30, ChronoUnit.DAYS))
                .build();
        repo.save(e);

        addCookie(res,"tdid",deviceId,30*24*3600);
        addCookie(res,"tdt", secret, 30*24*3600);
    }

    private void addCookie(HttpServletResponse res,String n,String v,int maxAge){
        Cookie c = new Cookie(n, v);
        c.setHttpOnly(true);
        c.setSecure(true);
        c.setPath("/");
        c.setMaxAge(maxAge);
        c.setAttribute("SameSite","Lax");
        res.addCookie(c);
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
}
