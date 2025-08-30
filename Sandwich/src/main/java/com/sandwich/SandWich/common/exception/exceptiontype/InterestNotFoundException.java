package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class InterestNotFoundException extends CustomException {
    public InterestNotFoundException() {
        super(HttpStatus.NOT_FOUND, "선택한 관심 분야가 존재하지 않습니다.");
    }
}