package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends CustomException {
    public EmailAlreadyExistsException() {
        super(HttpStatus.CONFLICT, "이미 가입된 이메일입니다. 로그인해주세요.");
    }
}