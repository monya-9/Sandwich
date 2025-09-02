package com.sandwich.SandWich.common.exception;

public class ErrorResponse {
    private final int status;
    private final String code;   // nullable
    private final String message;

    // 2-인자 오버로드(호환용)
    public ErrorResponse(int status, String message) {
        this(status, null, message);
    }

    // 3-인자(권장)
    public ErrorResponse(int status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public int getStatus() { return status; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
}