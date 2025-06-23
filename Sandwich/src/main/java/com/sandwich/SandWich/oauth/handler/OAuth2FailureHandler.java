package com.sandwich.SandWich.oauth.handler;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

//소셜 로그인 실패 시 프론트로 리디렉션하면서 사용자에게 오류 메시지를 전달
@Slf4j
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {

        String rawMessage = exception.getMessage();
        if (rawMessage == null || rawMessage.isBlank()) {
            rawMessage = "알 수 없는 오류가 발생했습니다.";
        }

        String errorMessage = URLEncoder.encode(rawMessage, StandardCharsets.UTF_8);
        String redirectUrl = "http://localhost:3000/oauth2/error?message=" + errorMessage;

        log.warn("[소셜 로그인 실패] {}", rawMessage);
        response.sendRedirect(redirectUrl);
    }
}