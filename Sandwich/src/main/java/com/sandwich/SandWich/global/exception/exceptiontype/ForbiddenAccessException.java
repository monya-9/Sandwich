package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ForbiddenAccessException extends CustomException {
    public ForbiddenAccessException() {
        super(HttpStatus.FORBIDDEN, "해당 리소스에 접근할 수 없습니다.");
    }
}