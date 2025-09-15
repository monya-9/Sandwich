package com.sandwich.SandWich.common.captcha;

import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(RecaptchaProperties.class)
public class RecaptchaFilter extends OncePerRequestFilter {

    private final RecaptchaProperties props;
    private final RecaptchaVerifier verifier;

    private Set<String> v3Paths() { return props.getV3().pathSet(); }
    private Set<String> v2Paths() { return props.getV2().pathSet(); }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!props.isEnabled()) return true;
        String path = request.getRequestURI();
        // v2 / v3 둘 다 아닌 경로면 필터 안탐
        return !(v2Paths().contains(path) || v3Paths().contains(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String path = req.getRequestURI();
        String token = req.getHeader("X-Recaptcha-Token");

        boolean ok;
        if (v2Paths().contains(path)) {
            ok = verifier.verifyV2(token, props.getV2().getSecret());
        } else if (v3Paths().contains(path)) {
            ok = verifier.verifyV3(token, props.getV3().getSecret(), props.getV3().getThreshold());
        } else {
            ok = true; // 방어적
        }

        if (!ok) {
            throw new BadRequestException("RECAPTCHA_FAIL", "reCAPTCHA 검증 실패");
        }
        chain.doFilter(req, res);
    }
}
