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
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(RecaptchaProperties.class)
public class RecaptchaFilter extends OncePerRequestFilter {

    private final RecaptchaProperties props;
    private final RecaptchaVerifier verifier;

    private Set<String> pathSet() {
        return Arrays.stream((props.getPaths()==null?"":props.getPaths()).split(","))
                .map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.toSet());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!props.isEnabled()) return true;
        String path = request.getRequestURI();
        for (String p : pathSet()) {
            if (path.equals(p)) return false; // 대상 경로면 필터링 수행
        }
        return true; // 대상 경로 아니면 스킵
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String token = req.getHeader("X-Recaptcha-Token");
        if (!verifier.verify(token)) {
            throw new BadRequestException("RECAPTCHA_FAIL", "reCAPTCHA 검증 실패");
        }
        chain.doFilter(req, res);
    }
}
