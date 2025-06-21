package com.sandwich.SandWich.controller;

import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.dto.*;
import com.sandwich.SandWich.repository.UserRepository;
import com.sandwich.SandWich.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest req) {
        // 이메일 인증 여부 확인 (코드가 아니라 플래그 기반)
        String verifiedKey = "email:verified:" + req.getEmail();
        String verified = redisTemplate.opsForValue().get(verifiedKey);

        if (!"true".equals(verified)) {
            return ResponseEntity.status(403).body("이메일 인증이 필요합니다.");
        }

        // 이메일 중복 검사
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("이미 가입된 이메일입니다.");
        }

        // 사용자 저장 (isVerified 컬럼도 true로)
        User user = User.builder()
                .email(req.getEmail())
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .provider("local")
                .isVerified(true) // 이메일 인증 여부를 DB에도 저장
                .build();

        userRepository.save(user);

        // 인증 상태 Redis에서 제거
        redisTemplate.delete(verifiedKey);

        return ResponseEntity.ok("가입 완료");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("회원 아님"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new RuntimeException("비밀번호 불일치");

        String accessToken = jwtUtil.createAccessToken(user.getUsername());
        String refreshToken = jwtUtil.createRefreshToken(user.getUsername());

        String redisKey = "refresh:userId:" + user.getId();
        redisTemplate.opsForValue().set(redisKey, refreshToken, Duration.ofDays(7));

        return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
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

        String newAccessToken = jwtUtil.createAccessToken(username);
        String newRefreshToken = jwtUtil.createRefreshToken(username);

        redisTemplate.opsForValue().set(redisKey, newRefreshToken, Duration.ofDays(7));

        return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken));
    }
}