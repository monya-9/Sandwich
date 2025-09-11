package com.sandwich.SandWich.notification.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Map;

@Getter @Builder
@AllArgsConstructor @NoArgsConstructor
public class NotifyPayload {
    private String event;              // COMMENT_CREATED, LIKE_CREATED, FOLLOW_CREATED, MESSAGE_CREATED ...
    private Long actorId;              // 행동 주체
    private Long targetUserId;         // 알림 수신자
    private Resource resource;         // 알림 관련 리소스
    private Map<String, Object> extra; // 스니펫 등
    private OffsetDateTime createdAt;
    private String deepLink;
    private String title;
    private String body;


    @Getter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class Resource {
        private String type;           // POST, ROOM, PROFILE, TEST ...
        private Long id;
    }
}