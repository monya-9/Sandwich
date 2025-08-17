package com.sandwich.SandWich.global.exception.exceptiontype;


import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageNotAllowedException extends CustomException {
    public MessageNotAllowedException(String message) {
        super(HttpStatus.FORBIDDEN, message); // 403 Forbidden
    }
}