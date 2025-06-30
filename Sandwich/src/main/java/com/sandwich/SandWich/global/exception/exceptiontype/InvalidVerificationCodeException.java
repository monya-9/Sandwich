package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class InvalidVerificationCodeException extends CustomException {
    public InvalidVerificationCodeException() {
        super(HttpStatus.BAD_REQUEST, "인증번호가 일치하지 않습니다.");
    }
}