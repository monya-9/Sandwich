package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class MessageRoomForbiddenException extends CustomException {
    public MessageRoomForbiddenException() {
        super(HttpStatus.FORBIDDEN, "이 채팅방에 접근할 수 없습니다.");
    }
}