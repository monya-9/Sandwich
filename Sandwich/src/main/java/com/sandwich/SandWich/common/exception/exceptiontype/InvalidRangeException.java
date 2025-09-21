package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class InvalidRangeException extends CustomException {
    public InvalidRangeException() {
        super(HttpStatus.BAD_REQUEST, "INVALID_RANGE", "fromId와 toId 범위가 올바르지 않습니다.");
    }
}