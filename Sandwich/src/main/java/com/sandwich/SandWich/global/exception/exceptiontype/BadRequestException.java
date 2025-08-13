package com.sandwich.SandWich.global.exception.exceptiontype;
import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class BadRequestException extends CustomException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }

    public BadRequestException() {
        super(HttpStatus.BAD_REQUEST, "잘못된 요청입니다.");
    }
}