package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.LikeCreatedEvent;
import com.sandwich.SandWich.notification.fanout.NotificationFanoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class LikeNotifyListener {

    private final NotificationFanoutService fanout;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLikeCreated(LikeCreatedEvent ev) {
        String type = ev.getResourceType();
        Long id = ev.getResourceId();

        String deep = switch (type) {
            case "PROJECT" -> "/projects/" + id;
            case "POST"    -> "/posts/" + id;
            case "COMMENT" -> "/posts/" + id + "#comment-" + id; // 필요 시 원글 경로로 보정
            default        -> "/";
        };

        var payload = NotifyPayload.builder()
                .event("LIKE_CREATED")
                .actorId(ev.getActorId())
                .targetUserId(ev.getTargetUserId())
                .resource(NotifyPayload.Resource.builder().type(type).id(id).build())
                .createdAt(OffsetDateTime.now())
                .title("새 좋아요가 도착했어요")
                .body("회원님의 " + type.toLowerCase() + "에 좋아요가 눌렸습니다")
                .deepLink(deep)
                .build();

        fanout.fanout(payload);
    }
}