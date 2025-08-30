package com.sandwich.SandWich.common.exception;

import org.springframework.http.HttpStatus;

public class CustomException extends RuntimeException {
    private final HttpStatus status;
    private final String code; // ← 추가

    public CustomException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.code = status.name();
    }

    public CustomException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}