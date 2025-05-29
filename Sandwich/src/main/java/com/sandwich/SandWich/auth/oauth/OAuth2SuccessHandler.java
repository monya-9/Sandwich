package com.sandwich.SandWich.auth.oauth;

import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.repository.UserRepository;
import com.sandwich.SandWich.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String username = oAuth2User.getAttribute("login");

        if (email == null || email.isBlank()) {
            email = username + "@github.local";
        }

        // DB에서 유저 정보 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OAuth 로그인 유저 DB 없음"));

        // JWT 생성
        String accessToken = jwtUtil.createToken(user.getUsername());

        // 프론트엔드 리다이렉트 URI (필요 시 수정 가능)
        String redirectUri = "http://localhost:3000/oauth2/success?token=" + accessToken;

        response.sendRedirect(redirectUri);
    }
}
