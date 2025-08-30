package com.sandwich.SandWich.common.exception.exceptiontype;

public class UnverifiedUserException extends RuntimeException {
    public UnverifiedUserException() {
        super("이메일 인증이 필요합니다.");
    }
}