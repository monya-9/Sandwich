package com.sandwich.SandWich.auth.service;

import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    private void validateSignup(SignupRequest req) {
        String verifiedKey = "email:verified:" + req.getEmail();
        String verified = redisTemplate.opsForValue().get(verifiedKey);

        if (!"true".equals(verified)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다.");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        if (req.getPositionId() == null) {
            throw new IllegalArgumentException("포지션은 필수 항목입니다.");
        }

        if (req.getInterestIds() == null || req.getInterestIds().isEmpty()) {
            throw new IllegalArgumentException("관심 분야는 최소 1개 이상 선택해주세요.");
        }
    }

    public void signup(SignupRequest req) {
        validateSignup(req);
        User user = User.builder()
                .email(req.getEmail())
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .provider("local")
                .isVerified(true)
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user); // 1. 유저 저장만 하고
        userService.saveProfile(user, req); // 2. 프로필 처리 위임
        redisTemplate.delete("email:verified:" + req.getEmail());  // 3. 인증 완료 처리
    }

    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtUtil.createAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getUsername());

        String redisKey = "refresh:userId:" + user.getId();
        redisTemplate.opsForValue().set(redisKey, refreshToken, Duration.ofDays(7));

        return new TokenResponse(accessToken, refreshToken, "local");
    }

}