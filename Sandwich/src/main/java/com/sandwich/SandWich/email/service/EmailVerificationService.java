package com.sandwich.SandWich.email.service;

import com.sandwich.SandWich.common.exception.exceptiontype.EmailVerificationExpiredException;
import com.sandwich.SandWich.common.exception.exceptiontype.InvalidVerificationCodeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.core.env.Environment;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final JavaMailSender mailSender;
    private final RedisTemplate<String, String> redisTemplate;
    private final Random random = new SecureRandom();
    private final Environment environment;
    public void sendVerificationCode(String email) {
        try {
            String code;
            // 테스트 환경일 경우 고정 코드 사용
            if (isTestProfile()) {
                code = "123456";
            } else {
                code = String.format("%06d", random.nextInt(1000000));
            }

            log.info("[이메일 인증] 생성된 코드: {}", code);

            String key = "email:verify:" + email;
            redisTemplate.opsForValue().set("email:verify:" + email, code, Duration.ofMinutes(5));
            log.info("[이메일 인증] Redis에 저장 완료: {} -> {}", key, code);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[SandWich] 이메일 인증 코드");
            message.setText("인증번호: " + code + "\n5분 안에 입력해주세요.");
            message.setFrom("happyhongsi03@naver.com");

            log.info("[이메일 인증] 메일 전송 시작 → 대상: {}", email);
            mailSender.send(message);
            log.info("[이메일 인증] 메일 전송 성공");
        } catch (Exception e) {
            log.error("[이메일 인증] 메일 전송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("메일 전송 중 오류가 발생했습니다.");
        }
}
    public void verifyCode(String email, String inputCode) {
        String key = "email:verify:" + email;
        String savedCode = redisTemplate.opsForValue().get(key);

        log.info("[이메일 인증] 검증 요청: {} → 사용자 입력 {}, Redis 저장 {}", email, inputCode, savedCode);

        if (savedCode == null) {
            throw new EmailVerificationExpiredException(); // Redis TTL 만료
        }

        if (!inputCode.equals(savedCode)) {
            throw new InvalidVerificationCodeException(); // 잘못된 코드 입력
        }

        log.info("[이메일 인증] 인증 성공");
        redisTemplate.opsForValue().set("email:verified:" + email, "true", Duration.ofMinutes(10));
        redisTemplate.delete(key);
    }

    private boolean isTestProfile() {
        return environment != null && List.of(environment.getActiveProfiles()).contains("test");
    }
}