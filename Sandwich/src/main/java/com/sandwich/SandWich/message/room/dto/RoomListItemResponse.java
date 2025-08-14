package com.sandwich.SandWich.message.room.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RoomListItemResponse {
    private Long roomId;

    // 상대 사용자
    private Long partnerId;
    private String partnerName;        // <-- User 엔티티 필드명에 맞게 바꿔도 됨
    private String partnerAvatarUrl;   // <-- 예: profileImageUrl 등

    // 마지막 메시지
    private Long lastMessageId;        // 서브쿼리로 구함(아래 JPQL 참고)
    private String lastMessageType;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;

    // 읽지 않음
    private long unreadCount;
}