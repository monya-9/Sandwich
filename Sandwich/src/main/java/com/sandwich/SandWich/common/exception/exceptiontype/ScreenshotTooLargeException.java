package com.sandwich.SandWich.common.exception.exceptiontype;

import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ScreenshotTooLargeException extends CustomException {
    public ScreenshotTooLargeException(int count, int max) {
        super(HttpStatus.PAYLOAD_TOO_LARGE, "SCREENSHOT_TOO_LARGE",
                "메시지 개수(" + count + ")가 허용 범위(" + max + ")를 초과했습니다.");
    }
}