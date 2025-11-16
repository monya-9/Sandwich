package com.sandwich.SandWich.notification.service;

import com.sandwich.SandWich.notification.dto.FollowNotificationPayload;
import org.springframework.stereotype.Service;

import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.FollowNotificationPayload;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FollowNotificationService {

    private final NotificationPublisher publisher;

    public void send(FollowNotificationPayload payload) {
        // 기존 DTO -> 공용 DTO 변환
        var notify = NotifyPayload.builder()
                .event("FOLLOW_CREATED")
                .actorId(payload.getSenderId())
                .resource(NotifyPayload.Resource.builder()
                        .type("PROFILE").id(payload.getSenderId()).build())
                .extra(Map.of(
                        "nickname", payload.getNickname(),
                        "profileImg", payload.getProfileImg(),
                        "link", payload.getLink()
                ))
                .createdAt(OffsetDateTime.now())
                .build();

        publisher.sendToUser(notify);
    }

}