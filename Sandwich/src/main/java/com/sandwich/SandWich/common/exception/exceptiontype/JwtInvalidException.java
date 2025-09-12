package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class JwtInvalidException extends CustomException {
    public JwtInvalidException() {
        super(HttpStatus.UNAUTHORIZED, "유효하지 않은 JWT 토큰입니다.");
    }
}