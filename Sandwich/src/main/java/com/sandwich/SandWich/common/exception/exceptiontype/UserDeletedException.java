package com.sandwich.SandWich.common.exception.exceptiontype;


import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class UserDeletedException extends CustomException {
    public UserDeletedException() {
        super(HttpStatus.FORBIDDEN, "탈퇴한 사용자입니다.");
    }
}