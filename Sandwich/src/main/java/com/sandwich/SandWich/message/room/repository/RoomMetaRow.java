package com.sandwich.SandWich.message.room.repository;

import java.time.OffsetDateTime;

public interface RoomMetaRow {
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