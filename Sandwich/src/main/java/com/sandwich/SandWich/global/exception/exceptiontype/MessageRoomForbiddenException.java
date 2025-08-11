package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageRoomForbiddenException extends CustomException {
    public MessageRoomForbiddenException() {
        super(HttpStatus.FORBIDDEN, "이 채팅방에 접근할 수 없습니다.");
    }
}