package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MissingFieldException extends CustomException {
    public MissingFieldException(String fieldName) {
        super(HttpStatus.BAD_REQUEST, String.format("'%s' 항목은 필수입니다. 값을 입력해주세요.", fieldName));
    }
}