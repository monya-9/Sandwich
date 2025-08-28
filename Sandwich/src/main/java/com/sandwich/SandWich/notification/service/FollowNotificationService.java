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
                .targetUserId(/* 팔로우 당한 유저 ID */ extractTargetUserId(payload))
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

    private Long extractTargetUserId(FollowNotificationPayload payload) {
        // TODO: 실제 타겟 유저 식별 로직(팔로우 도메인 흐름에서 받거나, 인자로 전달)
        // 임시로 null이면 예외 던지도록 하거나, 메서드 시그니처를 바꿔 targetUserId를 받게 설계해.
        throw new IllegalStateException("targetUserId 결정 로직을 연결하세요");
    }
}