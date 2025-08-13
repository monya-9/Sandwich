package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ForbiddenException extends CustomException {
    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }

    public ForbiddenException() {
        super(HttpStatus.FORBIDDEN, "이 작업을 수행할 권한이 없습니다.");
    }
}