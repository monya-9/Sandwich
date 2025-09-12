package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class TooManyRequestsException extends CustomException {
    public TooManyRequestsException(String code, String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, code, message);
    }
    public TooManyRequestsException() {
        super(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT", "요청이 너무 많습니다.");
    }
}