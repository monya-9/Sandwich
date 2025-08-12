package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageNotFoundException extends CustomException {
    public MessageNotFoundException() {
        super(HttpStatus.NOT_FOUND, "메시지를 찾을 수 없습니다.");
    }
}
