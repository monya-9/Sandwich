package com.sandwich.SandWich.message.room.repository;

import java.time.LocalDateTime;

public interface RoomListRow {
    Long getRoomId();
    Long getPartnerId();
    String getPartnerName();
    String getPartnerAvatarUrl();

    Long getLastMessageId();
    String getLastMessageType();
    String getLastMessagePreview();
    LocalDateTime getLastMessageAt();

    Long getUnreadCount();
}