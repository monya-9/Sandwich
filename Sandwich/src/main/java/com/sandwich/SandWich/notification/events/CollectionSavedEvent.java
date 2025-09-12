package com.sandwich.SandWich.notification.events;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;

@Getter
@AllArgsConstructor
@Builder
public class CollectionSavedEvent {
    private final Long actorId;        // 저장한 사람
    private final Long projectId;      // 저장된 프로젝트
    private final Long targetUserId;   // 알림 받는 사람(프로젝트 작성자)
    private final Long collectionId;   // 선택(없으면 null)
    private final String collectionName; // 선택(없으면 null)


}