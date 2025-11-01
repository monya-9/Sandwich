package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.CollectionSavedEvent;
import com.sandwich.SandWich.notification.fanout.NotificationFanoutService;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CollectionNotifyListener {

    private final NotificationFanoutService fanout;
    private final ProjectRepository projectRepository;

    @TransactionalEventListener
    public void onSaved(CollectionSavedEvent ev) {
        // 프로젝트 소유자 ID 조회 후 올바른 경로 생성
        Long ownerId = projectRepository.findAuthorIdById(ev.getProjectId()).orElse(null);
        String deepLink;
        if (ownerId != null) {
            deepLink = "/other-project/" + ownerId + "/" + ev.getProjectId();
        } else {
            log.warn("[CollectionNotify] PROJECT ownerId not found for projectId={}", ev.getProjectId());
            deepLink = "/";
        }

        // Object 로 맞추기 (id는 Long, name은 String 그대로 넣어도 됨)
        Map<String, Object> extra = new LinkedHashMap<>();
        if (ev.getCollectionId() != null)   extra.put("collectionId", ev.getCollectionId());
        if (ev.getCollectionName() != null && !ev.getCollectionName().isBlank())
            extra.put("collectionName", ev.getCollectionName());

        var payload = NotifyPayload.builder()
                .event("COLLECTION_SAVED")
                .actorId(ev.getActorId())
                .targetUserId(ev.getTargetUserId())
                .resource(NotifyPayload.Resource.builder()
                        .type("PROJECT").id(ev.getProjectId()).build())
                .extra(extra.isEmpty() ? null : extra)  // 빈 맵이면 null로
                .title("내 프로젝트가 컬렉션에 저장됐어요")
                .body((ev.getCollectionName() == null || ev.getCollectionName().isBlank())
                        ? "누군가가 컬렉션에 저장했습니다"
                        : "'" + ev.getCollectionName() + "'에 저장했습니다")
                .deepLink(deepLink)
                .createdAt(OffsetDateTime.now())
                .build();

        fanout.fanout(payload);
    }
}