package com.sandwich.SandWich.notification.events;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class CommentCreatedEvent {
    private final Long actorId;        // 댓글 단 사람
    private final String resourceType; // "POST" | "PROJECT" | "CHALLENGE" (대문자 권장)
    private final Long resourceId;     // 글/프로젝트/챌린지 ID
    private final Long targetUserId;   // 알림 받을 사용자
    private final String snippet;      // 내용 요약
}