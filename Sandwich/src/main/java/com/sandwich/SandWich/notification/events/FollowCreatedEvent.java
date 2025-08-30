package com.sandwich.SandWich.notification.events;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowCreatedEvent {
    private final Long actorId;       // 팔로우를 건 사람
    private final Long targetUserId;  // 팔로우를 당하는 사람(=받는 사람)
}