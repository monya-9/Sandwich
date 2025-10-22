package com.sandwich.SandWich.oauth.handler;

import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

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
        System.out.println("✅ OAuth2SuccessHandler 실행됨");

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String provider = oAuth2User.getProvider();

        // CustomOAuth2UserService에서 보장한 식별자 사용 (email or login)
        String email = oAuth2User.getAttribute("email");
        String username = oAuth2User.getAttribute("login"); // GitHub 전용

        if ((email == null || email.isBlank()) && username != null) {
            email = username + "@" + provider + ".local";
        }

        // 여기서는 "생성 금지" → 반드시 존재한다고 가정
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new IllegalStateException("OAuth2UserService에서 유저 생성/연동이 안 되었습니다."));

        // JWT 발급
        String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        // 닉네임 온보딩 필요 여부 판단 (프로필 없음 or 닉네임 공란)
        boolean needNickname = (user.getProfile() == null)
                || user.getProfile().getNickname() == null
                || user.getProfile().getNickname().isBlank();

        String redirectUriBase = "http://localhost:3000";
        String redirectPath = needNickname ? "/onboarding/nickname" : "/oauth2/success";

        String redirectUri = redirectUriBase + redirectPath
                + "?token=" + accessToken
                + "&refreshToken=" + refreshToken
                + "&email=" + user.getEmail()
                + "&provider=" + user.getProvider()
                + "&isProfileSet=" + Boolean.TRUE.equals(user.getIsProfileSet())
                + "&needNickname=" + needNickname;

        response.sendRedirect(redirectUri);
    }

}
