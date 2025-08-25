package com.sandwich.SandWich.message.ws.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class WsMessageBroadcast {
    private Long roomId;
    private Long messageId;
    private Long senderId;
    private String senderNickname;
    private String content;
    private String type;
    private boolean isRead;
    private OffsetDateTime sentAt; // ISO-8601(+09:00 포함)
}
