package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class EmailVerificationExpiredException extends CustomException {
    public EmailVerificationExpiredException() {
        super(HttpStatus.FORBIDDEN, "인증번호가 만료되었습니다. 다시 요청해주세요.");
    }
}