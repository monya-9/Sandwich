package com.sandwich.SandWich.exception;

import com.sandwich.SandWich.common.exception.GlobalExceptionHandler;
import com.sandwich.SandWich.common.exception.exceptiontype.TooManyRequestsException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TooManyRequestsExceptionStandaloneTest {

    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new TestController())
            .setControllerAdvice(new GlobalExceptionHandler()) // 예외 핸들러 직접 주입
            .build();

    @RestController
    @RequestMapping(value = "/test", produces = MediaType.APPLICATION_JSON_VALUE)
    static class TestController {
        @PostMapping("/force429/minute")
        public void minute() {
            throw new TooManyRequestsException("RATE_LIMIT_MINUTE", "요청이 너무 많습니다(분당 제한).");
        }
        @PostMapping("/force429/daily")
        public void daily() {
            throw new TooManyRequestsException("RATE_LIMIT_DAILY", "요청이 너무 많습니다(일일 제한).");
        }
    }

    @Test @DisplayName("429 - 분당 제한 포맷")
    void minuteRateLimit() throws Exception {
        mvc.perform(post("/test/force429/minute"))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_MINUTE"))
                .andExpect(jsonPath("$.message").value("요청이 너무 많습니다(분당 제한)."));
    }

    @Test @DisplayName("429 - 일일 제한 포맷")
    void dailyRateLimit() throws Exception {
        mvc.perform(post("/test/force429/daily"))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_DAILY"))
                .andExpect(jsonPath("$.message").value("요청이 너무 많습니다(일일 제한)."));
    }
}
