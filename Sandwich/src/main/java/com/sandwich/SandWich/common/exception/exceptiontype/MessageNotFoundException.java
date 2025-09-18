package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageNotFoundException extends CustomException {
    public MessageNotFoundException() {
        super(HttpStatus.NOT_FOUND, "MESSAGES_NOT_FOUND", "해당 범위 내 메시지가 존재하지 않습니다.");
    }
}
