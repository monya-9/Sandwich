package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends CustomException {
    public UserNotFoundException() {
        super(HttpStatus.NOT_FOUND, "해당 사용자를 찾을 수 없습니다.");
    }
    public UserNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
