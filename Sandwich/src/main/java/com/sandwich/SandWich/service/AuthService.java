package com.sandwich.SandWich.service;

import com.sandwich.SandWich.domain.*;
import com.sandwich.SandWich.dto.SignupRequest;
import com.sandwich.SandWich.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final InterestRepository interestRepository;
    private final UserPositionRepository userPositionRepository;
    private final UserInterestRepository userInterestRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;

    public void signup(SignupRequest req) {
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

        User user = User.builder()
                .email(req.email())
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .provider("local")
                .isVerified(true)
                .build();

        userRepository.save(user);

        // 포지션 연결
        Position position = positionRepository.findById(req.positionId())
                .orElseThrow(() -> new IllegalArgumentException("포지션이 존재하지 않습니다."));
        userPositionRepository.save(new UserPosition(user, position));

        // 관심 분야 연결
        List<Interest> interests = interestRepository.findAllById(req.interestIds());
        interests.forEach(i -> userInterestRepository.save(new UserInterest(user, i)));

        redisTemplate.delete(verifiedKey);
    }

    public void saveProfile(User user, SignupRequest req) {
        if (req.positionId() == null) throw new IllegalArgumentException("포지션은 필수입니다.");
        if (req.interestIds() == null || req.interestIds().isEmpty()) throw new IllegalArgumentException("관심 분야 최소 1개");

        Position position = positionRepository.findById(req.positionId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션"));

        userPositionRepository.save(new UserPosition(user, position));

        List<Interest> interests = interestRepository.findAllById(req.interestIds());
        interests.forEach(i -> userInterestRepository.save(new UserInterest(user, i)));
    }
}