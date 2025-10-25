package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.FollowCreatedEvent;
import com.sandwich.SandWich.notification.fanout.NotificationFanoutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class FollowNotifyListener {

    private final NotificationFanoutService fanout;

    @TransactionalEventListener
    public void onFollow(FollowCreatedEvent ev) {
        // 팔로워(보낸 사람) 프로필로 이동
        String deepLink = "/users/" + ev.getActorId();

        var payload = NotifyPayload.builder()
                .event("FOLLOW_CREATED")
                .actorId(ev.getActorId())
                .targetUserId(ev.getTargetUserId())
                .resource(NotifyPayload.Resource.builder().type("USER").id(ev.getActorId()).build())
                .extra(null)
                .createdAt(OffsetDateTime.now())
                .title("새 팔로워가 생겼어요")
                .body("누군가 회원님을 팔로우했어요")
                .deepLink(deepLink)
                .build();

        fanout.fanout(payload);
    }
}