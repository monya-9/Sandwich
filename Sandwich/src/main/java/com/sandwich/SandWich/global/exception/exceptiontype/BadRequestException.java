package com.sandwich.SandWich.global.exception.exceptiontype;
import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class BadRequestException extends CustomException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }


}