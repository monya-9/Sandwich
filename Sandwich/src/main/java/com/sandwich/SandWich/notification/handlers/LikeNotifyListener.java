package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.events.LikeCreatedEvent;
import com.sandwich.SandWich.notification.fanout.NotificationFanoutService;
import com.sandwich.SandWich.project.repository.ProjectRepository;
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
    private final ProjectRepository projectRepository;
    private final SubmissionRepository submissionRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLikeCreated(LikeCreatedEvent ev) {
        String type = ev.getResourceType();
        Long id = ev.getResourceId();

        String deep = switch (type) {
            case "PROJECT" -> {
                // 프로젝트 소유자 ID 조회 후 올바른 경로 생성
                Long ownerId = projectRepository.findAuthorIdById(id).orElse(null);
                if (ownerId != null) {
                    yield "/other-project/" + ownerId + "/" + id;
                }
                log.warn("[LikeNotify] PROJECT ownerId not found for projectId={}", id);
                yield "/";
            }
            case "CODE_SUBMISSION", "PORTFOLIO_SUBMISSION" -> {
                var subOpt = submissionRepository.findById(id);
                if (subOpt.isPresent()) {
                    var sub = subOpt.get();
                    Long chId = sub.getChallenge().getId();
                    yield "/challenges/" + chId + "/submissions/" + sub.getId();
                }
                log.warn("[LikeNotify] SUBMISSION not found for id={}", id);
                yield "/";
            }
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