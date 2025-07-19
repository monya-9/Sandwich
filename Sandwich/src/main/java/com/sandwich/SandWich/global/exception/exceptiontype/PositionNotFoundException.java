package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class PositionNotFoundException extends CustomException {
    public PositionNotFoundException() {
        super(HttpStatus.NOT_FOUND, "선택한 포지션이 존재하지 않습니다.");
    }
}