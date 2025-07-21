package com.sandwich.SandWich.auth.service;

import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.global.exception.exceptiontype.*;
import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RedisUtil redisUtil;

    private String generateUniqueUsername() {
        String base;
        do {
            base = "user_" + UUID.randomUUID().toString().substring(0, 8);
        } while (userRepository.existsByUsername(base));
        return base;
    }

    private void validateSignup(SignupRequest req) {
        String verified = redisUtil.getValue("email:verified:" + req.getEmail());

        if (!"true".equals(verified)) {
            throw new EmailVerificationExpiredException();
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new EmailAlreadyExistsException();
        }

        if (req.getPositionId() == null) {
            throw new MissingFieldException("포지션");
        }

        if (req.getInterestIds() == null || req.getInterestIds().isEmpty()) {
            throw new MissingFieldException("관심 분야");
        }
    }

    public void signup(SignupRequest req) {
        validateSignup(req);
        // username 자동 생성
        String username = generateUniqueUsername();
        User user = User.builder()
                .email(req.getEmail())
                .username(username)
                .password(passwordEncoder.encode(req.getPassword()))
                .provider("local")
                .isVerified(true)
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user); // 1. 유저 저장
        userService.saveBasicProfile(user, req); // 2. nickname 포함한 profile 생성
        redisUtil.deleteValue("email:verified:" + req.getEmail());  // 3. 인증 완료 처리
    }

    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmailAndIsDeletedFalse(req.getEmail())
                .orElseThrow(UserNotFoundException::new); // 존재하지 않는 이메일

        if (!user.getProvider().equals("local")) {
            throw new IllegalArgumentException("소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.");
        }

        // 탈퇴한 계정
        if (user.isDeleted()) {
            throw new UserDeletedException();
        }

        // 비밀번호 불일치
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new InvalidPasswordException();
        }

        String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());

        String redisKey = "refresh:userId:" + user.getId();
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        return new TokenResponse(accessToken, refreshToken, "local");
    }

    public void logout(String accessToken) {
        String username = jwtUtil.extractUsername(accessToken);
        User user = userRepository.findByEmailAndIsDeletedFalse(username)
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다."));
        String redisKey = "refresh:userId:" + user.getId();
        redisUtil.deleteRefreshToken(String.valueOf(user.getId()));
    }

}