package com.sandwich.SandWich.message.attach.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.util.MessagePreviewer;

public class ChatScreenshotRendererText {
    private ChatScreenshotRendererText(){}

    public static String previewForHtml(Message m) {
        // 프로젝트에 이미 있는 프리뷰 유틸이 있으면 그걸 호출
        // 없으면 Message 타입별로 적당히 문자열 만들어서 반환
        return MessagePreviewer.preview(m);
    }
}
