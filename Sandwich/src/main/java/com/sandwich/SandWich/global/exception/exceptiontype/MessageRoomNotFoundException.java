package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageRoomNotFoundException extends CustomException {
    public MessageRoomNotFoundException() {
        super(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다.");
    }
}