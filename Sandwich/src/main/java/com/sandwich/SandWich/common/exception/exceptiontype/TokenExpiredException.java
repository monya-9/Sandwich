package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class TokenExpiredException extends CustomException {
    public TokenExpiredException() {
        super(HttpStatus.UNAUTHORIZED, "Access Token이 만료되었습니다. 다시 로그인해주세요.");
    }
}