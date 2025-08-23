package com.sandwich.SandWich.message.room.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class RoomMetaResponse {
    private Long roomId;

    // 상대 사용자
    private Long partnerId;
    private String partnerName;
    private String partnerAvatarUrl;

    // 마지막 메시지
    private Long lastMessageId;
    private String lastMessageType;
    private String lastMessagePreview;
    private OffsetDateTime lastMessageAt;

    // 읽지 않음
    private long unreadCount;
}