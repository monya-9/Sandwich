package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class RefreshTokenNotFoundException extends CustomException {
    public RefreshTokenNotFoundException() {
        super(HttpStatus.UNAUTHORIZED, "리프레시 토큰이 존재하지 않습니다.");
    }
}