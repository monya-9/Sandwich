package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class JwtInvalidException extends CustomException {
    public JwtInvalidException() {
        super(HttpStatus.UNAUTHORIZED, "유효하지 않은 JWT 토큰입니다.");
    }
}