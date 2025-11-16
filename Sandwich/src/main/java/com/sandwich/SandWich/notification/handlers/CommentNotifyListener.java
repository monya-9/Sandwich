package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.CommentCreatedEvent;
import com.sandwich.SandWich.notification.fanout.NotificationFanoutService;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentNotifyListener {

    private final NotificationFanoutService fanout;
    private final ProjectRepository projectRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCommentCreated(CommentCreatedEvent ev) {
        Long id = ev.getResourceId();
        String type = ev.getResourceType();

        if (type == null) {
            log.warn("[CommentNotify] resourceType is null for resourceId={}", id);
            return;
        }

        String deepLink;
        switch (type) {
            case "PROJECT": {
                Long ownerId = projectRepository.findAuthorIdById(id).orElse(null);
                if (ownerId != null) {
                    deepLink = "/other-project/" + ownerId + "/" + id;
                } else {
                    log.warn("[CommentNotify] PROJECT ownerId not found for projectId={}", id);
                    deepLink = "/";
                }
                break;
            }
            case "CHALLENGE": {
                deepLink = "/challenges/" + id;
                break;
            }
            default: {
                log.warn("[CommentNotify] Unknown resourceType={}, id={}", type, id);
                deepLink = "/";
            }
        }

        var payload = NotifyPayload.builder()
                .event("COMMENT_CREATED")
                .actorId(ev.getActorId())
                .targetUserId(ev.getTargetUserId())
                .resource(NotifyPayload.Resource.builder().type(type).id(id).build())
                .extra(Map.of("snippet", ev.getSnippet()))
                .createdAt(OffsetDateTime.now())
                .title("새 댓글이 달렸어요")
                .body(ev.getSnippet())
                .deepLink(deepLink)
                .build();

        fanout.fanout(payload);
    }
}
