package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ProfileAlreadyExistsException extends CustomException {
    public ProfileAlreadyExistsException() {
        super(HttpStatus.BAD_REQUEST, "이미 프로필이 등록된 사용자입니다.");
    }
}