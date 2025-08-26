package com.sandwich.SandWich.notification.events;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class CommentCreatedEvent {
    private final Long actorId;
    private final Long postId;
    private final Long postAuthorId;  // 알림 대상
    private final String snippet;
}