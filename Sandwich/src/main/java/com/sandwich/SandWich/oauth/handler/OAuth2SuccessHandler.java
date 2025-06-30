package com.sandwich.SandWich.oauth.handler;

import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.JwtUtil;
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
    private final RedisUtil redisUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String provider = oAuth2User.getProvider();
        String email = oAuth2User.getAttribute("email");
        String username = oAuth2User.getAttribute("login");

        if (email == null || email.isBlank()) {
            email = username + "@github.local";
        }

        // DB에서 유저 정보 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException());

        // JWT 생성
        String accessToken = jwtUtil.createToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        // 프론트엔드 리다이렉트 URI
        String redirectUri = "http://localhost:3000/oauth2/success?token=" + accessToken
                + "&provider=" + user.getProvider();
        response.sendRedirect(redirectUri);
    }
}
