package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.auth.device.DeviceTrustService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class TrustedDeviceFilter extends OncePerRequestFilter {

    public static final String ATTR_TRUSTED = "trustedDevice";
    public static final String COOKIE_DEVICE_ID = "tdid";
    public static final String COOKIE_DEVICE_TOKEN = "tdt";

    private final DeviceTrustService deviceTrustService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            Cookie[] cookies = Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]);
            String tdid = Arrays.stream(cookies)
                    .filter(c -> COOKIE_DEVICE_ID.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst().orElse(null);
            String tdt = Arrays.stream(cookies)
                    .filter(c -> COOKIE_DEVICE_TOKEN.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst().orElse(null);

            if (tdid != null && tdt != null) {
                boolean ok = deviceTrustService.isTrusted(request); // 오버로드 사용
                if (ok) {
                    request.setAttribute(ATTR_TRUSTED, true);
                }
            }
        } catch (Exception e) {
            // 실패/에러는 로그만 남기고 그대로 진행
            log.debug("[TrustedDeviceFilter] skip due to error: {}", e.toString());
        }
        filterChain.doFilter(request, response);
    }
}
