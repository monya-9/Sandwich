package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageRoomNotFoundException extends CustomException {
    public MessageRoomNotFoundException() {
        super(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다.");
    }
}