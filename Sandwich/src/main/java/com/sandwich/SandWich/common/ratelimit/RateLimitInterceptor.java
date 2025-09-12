package com.sandwich.SandWich.common.ratelimit;

import com.sandwich.SandWich.auth.CurrentUserProvider;
import com.sandwich.SandWich.common.exception.exceptiontype.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitProperties props;
    private final RateLimiter limiter;
    private final CurrentUserProvider currentUser; // 네 프로젝트에서 이미 사용하던 컴포넌트

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {

        if (!props.isEnabled()) return true;

        final String method = req.getMethod();
        final String path = req.getRequestURI();

        // 쓰기 메서드만 제한
        final boolean isWrite = "POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method);
        if (!isWrite) return true;

        // 경로 매칭
        final boolean isSubmission = path.matches("^/api/challenges/\\d+/submissions$");
        final boolean isVote = path.startsWith("/api/challenges/") && path.contains("/votes");
        if (!isSubmission && !isVote) return true;

        // 라우트/룰 결정
        final String routeType = isSubmission ? "submit" : "vote";
        final RateLimitProperties.Rule rule = isSubmission ? props.getSubmission() : props.getVote();

        // 유저ID(실패 시 null → IP 기준)
        Long userId = null;
        try { userId = currentUser.currentUserId(); } catch (Exception ignore) {}

        // 1) 분당 제한
        boolean okMin = limiter.tryConsume(
                RateLimiter.bucket(req, userId, routeType, "min"),
                rule.getPerMin(), Duration.ofMinutes(1)
        );
        if (!okMin) throw new TooManyRequestsException("RATE_LIMIT_MINUTE", "요청이 너무 많습니다(분당 제한).");

        // 2) 일일 제한
        boolean okDay = limiter.tryConsume(
                RateLimiter.bucket(req, userId, routeType, "day"),
                rule.getPerDay(), Duration.ofDays(1)
        );
        if (!okDay) throw new TooManyRequestsException("RATE_LIMIT_DAILY", "요청이 너무 많습니다(일일 제한).");

        return true;
    }
}
