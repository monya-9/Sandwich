package com.sandwich.SandWich.common.ratelimit;

import com.sandwich.SandWich.auth.CurrentUserProvider;
import com.sandwich.SandWich.common.exception.GlobalExceptionHandler;
import com.sandwich.SandWich.common.exception.exceptiontype.TooManyRequestsException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RateLimitInterceptorStandaloneTest {

    // ---- 가짜 RateLimiter (2번째 요청부터 제한) ----
    static class FakeLimiter extends RateLimiter {
        private final java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> counters =
                new java.util.concurrent.ConcurrentHashMap<>();

        FakeLimiter() { super(null); } // 실제 Redis 미사용

        @Override
        public boolean tryConsume(String bucketKey, int limit, java.time.Duration window) {
            int n = counters.computeIfAbsent(bucketKey, k -> new java.util.concurrent.atomic.AtomicInteger())
                    .incrementAndGet();

            // 분당 버킷: 첫 호출만 허용, 두 번째부터 차단 → RATE_LIMIT_MINUTE 유도
            if (window.toMinutes() == 1) {
                return n <= 1;
            }

            // 일일 버킷: 넉넉히 허용 (항상 true)
            if (window.toDays() == 1) {
                return true;
            }

            // 기타는 허용
            return true;
        }
    }


    // ---- 고정 유저ID 제공자 ----
    static class FixedUser implements CurrentUserProvider {
        @Override public Long currentUserId() { return 123L; }
    }

    // ---- 테스트용 컨트롤러 (정상 시 200) ----
    @RestController
    @RequestMapping(value="/api/challenges", produces = MediaType.APPLICATION_JSON_VALUE)
    static class TestController {
        @PostMapping("/{id}/submissions") public void submit(@PathVariable Long id) { }
        @PostMapping("/{id}/votes")       public void vote(@PathVariable Long id) { }
    }

    private MockMvc mvc(HandlerInterceptor interceptor) {
        return MockMvcBuilders
                .standaloneSetup(new TestController())
                .addInterceptors(interceptor)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private RateLimitInterceptor interceptorForSubmit() {
        RateLimitProperties p = new RateLimitProperties();
        p.setEnabled(true);
        p.getSubmission().setPerMin(3); p.getSubmission().setPerDay(50);
        p.getVote().setPerMin(10); p.getVote().setPerDay(200);
        return new RateLimitInterceptor(p, new FakeLimiter(), new FixedUser());
    }

    @Test @DisplayName("제출: 두 번째 요청에서 429")
    void submissionSecondHit429() throws Exception {
        MockMvc m = mvc(interceptorForSubmit());
        // 1번째: OK
        m.perform(post("/api/challenges/1/submissions")).andExpect(status().isOk());
        // 2번째: 429
        m.perform(post("/api/challenges/1/submissions"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_MINUTE"));
    }

    @Test @DisplayName("투표: 두 번째 요청에서 429")
    void voteSecondHit429() throws Exception {
        MockMvc m = mvc(interceptorForSubmit());
        // 1번째: OK
        m.perform(post("/api/challenges/1/votes")).andExpect(status().isOk());
        // 2번째: 429
        m.perform(post("/api/challenges/1/votes"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_MINUTE"));
    }
}
