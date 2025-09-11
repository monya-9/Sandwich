package com.sandwich.SandWich.common.exception.exceptiontype;
import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class BadRequestException extends CustomException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }

    public BadRequestException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }

}