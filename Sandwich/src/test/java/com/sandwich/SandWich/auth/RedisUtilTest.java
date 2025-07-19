package com.sandwich.SandWich.auth;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.global.exception.exceptiontype.RefreshTokenNotFoundException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RedisUtilTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisUtil redisUtil;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        redisUtil = new RedisUtil(redisTemplate); //
    }

    @Test
    void refreshToken_저장_성공() {
        // given
        String userId = "1";
        String token = "refresh-token-value";

        // when
        redisUtil.saveRefreshToken(userId, token);

        // then
        verify(valueOperations, times(1))
                .set(eq("refresh:userId:" + userId), eq(token), eq(Duration.ofDays(7)));

    }

    @Test
    void refreshToken_조회_성공() {
        // given
        String userId = "1";
        String token = "refresh-token-value";
        when(valueOperations.get("refresh:userId:" + userId)).thenReturn(token);

        // when
        String result = redisUtil.getRefreshToken(userId);

        // then
        assertEquals(token, result);
    }

    @Test
    void refreshToken_조회_실패시_예외() {
        // given
        String userId = "99";
        when(valueOperations.get("refresh:userId:" + userId)).thenReturn(null);

        // expect
        assertThrows(RefreshTokenNotFoundException.class, () -> {
            redisUtil.getRefreshToken(userId);
        });
    }

    @Test
    void refreshToken_삭제_성공() {
        // given
        String userId = "1";

        // when
        redisUtil.deleteRefreshToken(userId);

        // then
        verify(redisTemplate, times(1)).delete("refresh:userId:" + userId);
    }
}
