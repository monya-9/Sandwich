package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ForbiddenAccessException extends CustomException {
    public ForbiddenAccessException() {
        super(HttpStatus.FORBIDDEN, "해당 리소스에 접근할 수 없습니다.");
    }
}