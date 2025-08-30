package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageNotFoundException extends CustomException {
    public MessageNotFoundException() {
        super(HttpStatus.NOT_FOUND, "메시지를 찾을 수 없습니다.");
    }
}
