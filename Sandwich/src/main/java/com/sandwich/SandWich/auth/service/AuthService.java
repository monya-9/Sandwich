package com.sandwich.SandWich.auth.service;

import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    private void validateSignup(SignupRequest req) {
        String verifiedKey = "email:verified:" + req.email();
        String verified = redisTemplate.opsForValue().get(verifiedKey);

        if (!"true".equals(verified)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다.");
        }

        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        if (req.positionId() == null) {
            throw new IllegalArgumentException("포지션은 필수 항목입니다.");
        }

        if (req.interestIds() == null || req.interestIds().isEmpty()) {
            throw new IllegalArgumentException("관심 분야는 최소 1개 이상 선택해주세요.");
        }
    }

    public void signup(SignupRequest req) {
        validateSignup(req);
        User user = User.builder()
                .email(req.email())
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .provider("local")
                .isVerified(true)
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user); // 1. 유저 저장만 하고
        userService.saveProfile(user, req); // 2. 프로필 처리 위임
        redisTemplate.delete("email:verified:" + req.email());  // 3. 인증 완료 처리
    }

}