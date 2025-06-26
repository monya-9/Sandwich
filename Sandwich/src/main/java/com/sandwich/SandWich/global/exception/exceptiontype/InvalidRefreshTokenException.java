package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends CustomException {
    public InvalidRefreshTokenException() {
        super(HttpStatus.UNAUTHORIZED, "Refresh Token이 유효하지 않거나 서버에 존재하지 않습니다.");
    }
}