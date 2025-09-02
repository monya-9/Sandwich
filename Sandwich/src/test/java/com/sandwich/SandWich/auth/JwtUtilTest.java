package com.sandwich.SandWich.auth;

import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.exception.exceptiontype.JwtInvalidException;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        // 테스트 시작 전마다 JwtUtil 인스턴스를 새로 생성하여 초기화
        jwtUtil = new JwtUtil();
    }

    @Test
    void accessToken_생성_및_이메일_추출_성공() {
        // given: 사용자 이메일과 역할 정보
        String email = "testuser@example.com";
        String role = "ROLE_USER";

        // when: 액세스 토큰 생성 후 이메일 추출
        String token = jwtUtil.createAccessToken(email, role);
        String extractedEmail = jwtUtil.extractUsername(token);

        // then: 토큰에서 추출된 이메일이 원래 이메일과 같은지 확인
        assertEquals(email, extractedEmail);
    }

    @Test
    void refreshToken_생성_및_파싱_성공() {
        // given: 사용자 이메일 정보
        String email = "refreshuser@example.com";

        // when: 리프레시 토큰 생성 후 Claims 정보 파싱
        String refreshToken = jwtUtil.createRefreshToken(email);
        Claims claims = jwtUtil.parseClaims(refreshToken);

        // then: 클레임에서 추출한 subject가 원래 이메일과 같은지 확인
        assertEquals(email, claims.getSubject());
    }

    @Test
    void 잘못된_토큰_입력시_JwtInvalidException_발생() {
        // given: 형식이 완전히 잘못된 JWT 문자열
        String invalidToken = "this.is.not.a.valid.token";

        // expect: parseClaims 실행 시 JwtInvalidException 발생해야 함
        assertThrows(JwtInvalidException.class, () -> {
            jwtUtil.parseClaims(invalidToken);
        });
    }
}
