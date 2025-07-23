package com.sandwich.SandWich.auth.controller;

import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.RefreshRequest;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.global.exception.exceptiontype.InvalidRefreshTokenException;
import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.ProfileRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sandwich.SandWich.auth.service.AuthService;

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

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok("가입 완료");
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest req) {
        TokenResponse tokenResponse = authService.login(req);
        return ResponseEntity.ok(tokenResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        String email = jwtUtil.validateToken(refreshToken);

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(UserNotFoundException::new);

        String storedToken = redisUtil.getRefreshToken(String.valueOf(user.getId()));
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new InvalidRefreshTokenException();
        }

        String newAccessToken = jwtUtil.createAccessToken(user.getUsername(), user.getRole().name());
        String newRefreshToken = jwtUtil.createRefreshToken(email);
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), newRefreshToken);

        return ResponseEntity.ok(new TokenResponse(newAccessToken, newRefreshToken, "local"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        authService.logout(token);
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
}