package com.sandwich.SandWich.email;

import com.sandwich.SandWich.email.service.EmailVerificationService;
import com.sandwich.SandWich.common.exception.exceptiontype.EmailVerificationExpiredException;
import com.sandwich.SandWich.common.exception.exceptiontype.InvalidVerificationCodeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailVerificationServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private EmailVerificationService emailVerificationService;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        emailVerificationService = new EmailVerificationService(null, redisTemplate, null);
    }

    @Test
    void 올바른_코드일_경우_인증성공() {
        // given
        String email = "test@example.com";
        String inputCode = "123456";
        when(valueOperations.get("email:verify:" + email)).thenReturn("123456");

        // when & then
        assertDoesNotThrow(() -> {
            emailVerificationService.verifyCode(email, inputCode);
        });
    }

    @Test
    void 인증번호가_없을경우_예외발생() {
        // given
        String email = "expired@example.com";
        when(valueOperations.get("email:verify:" + email)).thenReturn(null);

        // when & then
        assertThrows(EmailVerificationExpiredException.class, () -> {
            emailVerificationService.verifyCode(email, "123456");
        });
    }

    @Test
    void 인증번호가_일치하지_않을경우_예외발생() {
        // given
        String email = "wrongcode@example.com";
        when(valueOperations.get("email:verify:" + email)).thenReturn("654321");

        // when & then
        assertThrows(InvalidVerificationCodeException.class, () -> {
            emailVerificationService.verifyCode(email, "123456");
        });
    }
}
