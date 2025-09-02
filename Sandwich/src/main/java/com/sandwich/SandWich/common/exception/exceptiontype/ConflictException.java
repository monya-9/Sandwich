package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ConflictException extends CustomException {
    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }

    public ConflictException() {
        super(HttpStatus.CONFLICT, "요청이 현재 리소스 상태와 충돌합니다.");
    }

    public ConflictException(String code, String message) {
        super(HttpStatus.CONFLICT, code, message);
    }
}