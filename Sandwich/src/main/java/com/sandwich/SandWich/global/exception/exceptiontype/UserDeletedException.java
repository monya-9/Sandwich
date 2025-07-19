package com.sandwich.SandWich.global.exception.exceptiontype;


import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class UserDeletedException extends CustomException {
    public UserDeletedException() {
        super(HttpStatus.FORBIDDEN, "탈퇴한 사용자입니다.");
    }
}