package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class InternalServerErrorException extends CustomException {
    public InternalServerErrorException(String message, Throwable cause) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
        initCause(cause);
    }
}