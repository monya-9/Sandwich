package com.sandwich.SandWich.notification.events;

import lombok.AllArgsConstructor; import lombok.Getter;

@Getter
@AllArgsConstructor
public class LikeCreatedEvent {
    private final Long actorId;
    private final String resourceType; // "PROJECT" | "POST" | "COMMENT"
    private final Long resourceId;
    private final Long targetUserId;   // 알림 받을 작성자
}