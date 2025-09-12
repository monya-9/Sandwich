package com.sandwich.SandWich.common.captcha;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.common.exception.ErrorResponse;
import com.sandwich.SandWich.common.exception.CustomException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** 테스트 컨트롤러: 로그인/회원가입 + 핑 */
@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
class TestAuthController {
    @PostMapping("/api/auth/login")  public void login()  { }
    @PostMapping("/api/auth/signup") public void signup() { }
    @PostMapping("/api/health/ping") public void ping()   { } // ← 대상 아님 경로 처리 (200 기대)
}

class RecaptchaFilterStandaloneTest {

    /** 테스트 전용: 필터에서 던진 CustomException을 JSON 응답으로 변환 */
    static class TestExceptionWrappingFilter extends OncePerRequestFilter {
        private final ObjectMapper om = new ObjectMapper();
        @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, java.io.IOException {
            try {
                chain.doFilter(req, res);
            } catch (CustomException ex) {
                res.setStatus(ex.getStatus().value());
                res.setContentType("application/json");
                var body = new ErrorResponse(ex.getStatus().value(), ex.getCode(), ex.getMessage());
                res.getWriter().write(om.writeValueAsString(body));
            }
        }
    }

    private MockMvc mvc(RecaptchaProperties props, RecaptchaVerifier verifier) {
        // **필수**: 예외 래핑 필터를 RecaptchaFilter보다 먼저 추가(바깥에서 감싸도록)
        return MockMvcBuilders
                .standaloneSetup(new TestAuthController())
                .addFilters(new TestExceptionWrappingFilter(), new RecaptchaFilter(props, verifier))
                .build();
    }

    private RecaptchaProperties enabledProps() {
        RecaptchaProperties p = new RecaptchaProperties();
        p.setEnabled(true);
        p.setPaths("/api/auth/login,/api/auth/signup");
        p.setThreshold(0.5);
        p.setTestBypassToken("dev-ok");
        p.setSecret("dummy");
        return p;
    }
    // 검증기 스텁: dev-ok만 성공
    private RecaptchaVerifier stubVerifier() { return token -> "dev-ok".equals(token); }

    @Test @DisplayName("검증 대상 경로 + 토큰 없음 → 400 RECAPTCHA_FAIL")
    void failWhenMissingTokenOnTargetPath() throws Exception {
        MockMvc m = mvc(enabledProps(), stubVerifier());
        m.perform(post("/api/auth/login"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RECAPTCHA_FAIL"));
    }

    @Test @DisplayName("검증 대상 경로 + 우회 토큰 → 200")
    void passWhenBypassToken() throws Exception {
        MockMvc m = mvc(enabledProps(), stubVerifier());
        m.perform(post("/api/auth/login").header("X-Recaptcha-Token", "dev-ok"))
                .andExpect(status().isOk());
    }

    @Test @DisplayName("대상 아님 → 필터 미동작(토큰 없어도 200)")
    void passWhenNotTargetPath() throws Exception {
        MockMvc m = mvc(enabledProps(), stubVerifier());
        m.perform(post("/api/health/ping"))
                .andExpect(status().isOk());
    }

    @Test @DisplayName("비활성화 → 필터 완전 비활성(토큰 없어도 200)")
    void passWhenDisabled() throws Exception {
        RecaptchaProperties p = new RecaptchaProperties();
        p.setEnabled(false);
        p.setPaths("/api/auth/login");
        MockMvc m = mvc(p, stubVerifier());
        m.perform(post("/api/auth/login"))
                .andExpect(status().isOk());
    }
}
