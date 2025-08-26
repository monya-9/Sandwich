package com.sandwich.SandWich.notification.handlers;


import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.CommentCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CommentNotifyListener {

    private final NotificationPublisher publisher;

    @TransactionalEventListener // AFTER_COMMIT
    public void onCommentCreated(CommentCreatedEvent ev) {
        var payload = NotifyPayload.builder()
                .event("COMMENT_CREATED")
                .actorId(ev.getActorId())
                .targetUserId(ev.getPostAuthorId())
                .resource(NotifyPayload.Resource.builder()
                        .type("POST").id(ev.getPostId()).build())
                .extra(Map.of("snippet", ev.getSnippet()))
                .createdAt(OffsetDateTime.now())
                .build();

        publisher.sendToUser(payload);
    }
}