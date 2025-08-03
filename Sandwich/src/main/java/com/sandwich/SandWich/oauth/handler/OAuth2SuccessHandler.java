package com.sandwich.SandWich.oauth.handler;

import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
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
    private final RedisUtil redisUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        System.out.println("OAuth2SuccessHandler 실행됨");

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String provider = oAuth2User.getProvider();
        String email = oAuth2User.getAttribute("email");
        String username = oAuth2User.getAttribute("login");

        // GitHub는 이메일이 없으면 가짜 이메일 생성
        if (email == null || email.isBlank()) {
            email = username + "@github.local";
        }

        final String socialEmail = email;
        final String socialProvider = provider;

        // 1️⃣ 유저 조회 or 신규 생성
        User user = userRepository.findByEmailAndIsDeletedFalse(socialEmail)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(socialEmail)
                            .username(username)
                            .provider(socialProvider)
                            .role(Role.ROLE_USER)
                            .build();
                    System.out.println("[OAuth2] 신규 소셜 유저 생성됨: " + socialEmail);
                    return userRepository.saveAndFlush(newUser); // ✅ 즉시 flush
                });

        // 2️⃣ JWT 발급
        String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        // 3️⃣ 프로필 여부 확인
        boolean profileComplete = user.getProfile() != null;

        // 4️⃣ 프론트 리다이렉트
        String redirectUri = "http://localhost:3000/oauth2/success"
                + "?token=" + accessToken
                + "&refreshToken=" + refreshToken
                + "&provider=" + user.getProvider()
                + "&isProfileSet=" + profileComplete;

        response.sendRedirect(redirectUri);
    }
}
