package com.sandwich.SandWich.auth.controller;

import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.RefreshRequest;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.common.exception.exceptiontype.InvalidRefreshTokenException;
import com.sandwich.SandWich.common.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.ProfileRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sandwich.SandWich.auth.service.AuthService;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.RedisTemplate;


import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final RedisUtil redisUtil;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JwtUtil jwtUtil;
    private final AuthService authService;
    private final RedisTemplate<String, String> redisTemplate;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok("가입 완료");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        Object result = authService.login(req, request, response);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody(required = false) RefreshRequest request,
                                                 HttpServletRequest httpReq,
                                                 HttpServletResponse httpRes) {
        // 1) body 또는 쿠키에서 refreshToken 얻기
        String refreshToken = (request != null ? request.getRefreshToken() : null);
        if (refreshToken == null || refreshToken.isBlank()) {
            if (httpReq.getCookies() != null) {
                for (Cookie c : httpReq.getCookies()) {
                    if ("REFRESH_TOKEN".equals(c.getName())) {
                        refreshToken = c.getValue();
                        break;
                    }
                }
            }
        }
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException(); // 401
        }

        // 2) 검증 및 유저 로딩
        String email = jwtUtil.validateToken(refreshToken);
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(UserNotFoundException::new);

        String storedToken = redisUtil.getRefreshToken(String.valueOf(user.getId()));
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new InvalidRefreshTokenException();
        }

        // 3) 새 토큰 생성
        String newAccessToken  = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtUtil.createRefreshToken(user.getEmail());

        // 4) Redis 저장 (TTL 7일)
        redisTemplate.opsForValue().set(
                "refresh:userId:" + user.getId(),
                newRefreshToken,
                7, TimeUnit.DAYS
        );

        // 5) 쿠키로 내려주기 (환경변수 기반 속성)
        String sameSite = System.getenv().getOrDefault("TOKEN_COOKIE_SAMESITE", "None");
        boolean secure  = Boolean.parseBoolean(System.getenv().getOrDefault("TOKEN_COOKIE_SECURE", "true"));
        String domain   = System.getenv().getOrDefault("TOKEN_COOKIE_DOMAIN", "");

        addTokenCookie(httpRes, "ACCESS_TOKEN", newAccessToken, 60 * 60, sameSite, secure, domain);
        addTokenCookie(httpRes, "REFRESH_TOKEN", newRefreshToken, 14 * 24 * 60 * 60, sameSite, secure, domain);

        // (호환용) 바디에도 같이 리턴해두면 기존 프론트 로직과 충돌 없음
        return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken, user.getProvider()));
    }

    private void addTokenCookie(HttpServletResponse res,
                                String name, String value, int maxAgeSeconds,
                                String sameSite, boolean secure, String domain) {
        var builder = org.springframework.http.ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)  // "None"|"Lax"|"Strict"
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds));
        if (domain != null && !domain.isBlank()) builder = builder.domain(domain);
        res.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, builder.build().toString());
    }



    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    HttpServletRequest httpReq,
                                    HttpServletResponse httpRes) {
        // 1) 가능하면 헤더에서
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        // 2) 헤더가 없으면 쿠키에서
        if (token == null && httpReq.getCookies() != null) {
            for (Cookie c : httpReq.getCookies()) {
                if ("ACCESS_TOKEN".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }
        // 3) 토큰이 있으면 Redis refresh 삭제 로직 태우기
        try {
            if (token != null && !token.isBlank()) {
                authService.logout(token);
            }
        } catch (Exception ignored) {}

        // 4) 쿠키 만료
        killCookie(httpRes, "ACCESS_TOKEN");
        killCookie(httpRes, "REFRESH_TOKEN");
        return ResponseEntity.ok("로그아웃 완료");
    }

    @GetMapping("/nickname/check")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean exists = profileRepository.existsByNickname(nickname);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "message", exists ? "이미 사용 중인 닉네임입니다." : "사용 가능한 닉네임입니다."
        ));
    }
    private void killCookie(HttpServletResponse res, String name) {
        String sameSite = System.getenv().getOrDefault("TOKEN_COOKIE_SAMESITE", "None");
        boolean secure  = Boolean.parseBoolean(System.getenv().getOrDefault("TOKEN_COOKIE_SECURE", "true"));
        String domain   = System.getenv().getOrDefault("TOKEN_COOKIE_DOMAIN", "");

        var builder = org.springframework.http.ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ZERO);
        if (!domain.isBlank()) builder = builder.domain(domain);
        res.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam("value") String email) {
        email = (email == null) ? "" : email.trim();

        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "duplicate", false,
                            "message", "유효한 이메일 형식이 아닙니다."
                    ));
        }

        boolean duplicate = userRepository.existsByEmail(email);

        return ResponseEntity.ok(Map.of(
                "duplicate", duplicate,
                "message", duplicate
                        ? "이미 가입된 이메일입니다."
                        : "사용 가능한 이메일입니다."
        ));
    }
}