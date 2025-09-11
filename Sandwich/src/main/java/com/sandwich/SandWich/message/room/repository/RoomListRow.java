package com.sandwich.SandWich.message.room.repository;

import java.time.OffsetDateTime;

public interface RoomListRow {
    Long getRoomId();
    Long getPartnerId();
    String getPartnerName();
    String getPartnerAvatarUrl();

    Long getLastMessageId();
    String getLastMessageType();
    String getLastMessagePreview();
    OffsetDateTime getLastMessageAt();

    Long getUnreadCount();
}