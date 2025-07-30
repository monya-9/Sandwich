//package com.sandwich.SandWich.auth;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.sandwich.SandWich.auth.dto.LoginRequest;
//import com.sandwich.SandWich.auth.dto.SignupRequest;
//import com.sandwich.SandWich.auth.dto.TokenResponse;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.http.MediaType;
//import org.springframework.test.context.ActiveProfiles;
//import org.springframework.test.web.servlet.MockMvc;
//import org.springframework.test.web.servlet.MvcResult;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//
//import static org.hamcrest.Matchers.is;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@ActiveProfiles("test")
//@SpringBootTest
//@AutoConfigureMockMvc
//@Transactional
//class AuthIntegrationTest {
//
//    @Autowired private MockMvc mockMvc;
//    @Autowired private ObjectMapper objectMapper;
//    @Autowired private RedisTemplate<String, String> redisTemplate;
//
//    @Test
//    void 회원가입_로그인_조회_탈퇴_시나리오() throws Exception {
//        String email = "testuser@example.com";
//
//        // [1] 이메일 인증 요청 (코드 전송)
//        mockMvc.perform(post("/api/email/send")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"email\": \"" + email + "\"}"))
//                .andExpect(status().isOk());
//
//        // [2] 고정된 인증번호로 검증
//        mockMvc.perform(post("/api/email/verify")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"email\": \"" + email + "\", \"code\": \"123456\"}"))
//                .andExpect(status().isOk());
//
//        // [3] 회원가입 요청
//        SignupRequest signupRequest = new SignupRequest(
//                email,
//                "Test1234!",
//                "테스트유저",
//                1L,             // positionId
//                List.of(2L, 4L) // interestIds
//        );
//
//        mockMvc.perform(post("/api/auth/signup")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(signupRequest)))
//                .andExpect(status().isOk());
//
//        // [4] 로그인 요청
//        LoginRequest loginRequest = new LoginRequest(email, "Test1234!");
//        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(loginRequest)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.accessToken").exists())
//                .andExpect(jsonPath("$.refreshToken").exists())
//                .andReturn();
//
//        // [5] accessToken 추출
//        String responseJson = loginResult.getResponse().getContentAsString();
//        TokenResponse tokenResponse = objectMapper.readValue(responseJson, TokenResponse.class);
//        String accessToken = tokenResponse.getAccessToken();
//
//        // [6] /me 사용자 정보 조회
//        mockMvc.perform(get("/api/users/me")
//                        .header("Authorization", "Bearer " + accessToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.email", is(email)));
//
//        // [7] 탈퇴 요청
//        mockMvc.perform(delete("/api/users/me")
//                        .header("Authorization", "Bearer " + accessToken))
//                .andExpect(status().isOk())
//                .andExpect(content().string("회원 탈퇴 완료"));
//
//        // [8] 탈퇴 후 로그인 시도 → 실패 (404 Forbidden)
//        mockMvc.perform(post("/api/auth/login")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(loginRequest)))
//                .andExpect(status().isNotFound());
//    }
//}
