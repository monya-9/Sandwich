package com.sandwich.SandWich.auth.controller;

import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.RefreshRequest;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.sandwich.SandWich.auth.service.AuthService;
import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        try {
            authService.signup(req);
            return ResponseEntity.ok("가입 완료");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            TokenResponse tokenResponse = authService.login(req);
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        String username;
        try {
            username = jwtUtil.validateToken(refreshToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Refresh Token이 유효하지 않습니다.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        String redisKey = "refresh:userId:" + user.getId();
        String storedToken = redisTemplate.opsForValue().get(redisKey);

        if (storedToken == null || !storedToken.equals(refreshToken)) {
            return ResponseEntity.status(401).body("Refresh Token이 서버에 존재하지 않거나 일치하지 않습니다.");
        }

        String newAccessToken = jwtUtil.createAccessToken(user.getUsername(), user.getRole().name());
        String newRefreshToken = jwtUtil.createRefreshToken(username);

        redisTemplate.opsForValue().set(redisKey, newRefreshToken, Duration.ofDays(7));

        return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken, "local"));
    }


}