package com.sandwich.SandWich.notification.handlers;

import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.comment.repository.CommentRepository;
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
    private final CommentRepository commentRepository;

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
            case "CODE_SUBMISSION" -> {
                var subOpt = submissionRepository.findById(id);
                if (subOpt.isPresent()) {
                    var sub = subOpt.get();
                    Long chId = sub.getChallenge().getId();
                    yield "/challenge/code/" + chId + "/submissions/" + sub.getId();
                }
                log.warn("[LikeNotify] CODE_SUBMISSION not found for id={}", id);
                yield "/";
            }
            case "PORTFOLIO_SUBMISSION" -> {
                var subOpt = submissionRepository.findById(id);
                if (subOpt.isPresent()) {
                    var sub = subOpt.get();
                    Long chId = sub.getChallenge().getId();
                    yield "/challenge/portfolio/" + chId + "/vote/" + sub.getId();
                }
                log.warn("[LikeNotify] PORTFOLIO_SUBMISSION not found for id={}", id);
                yield "/";
            }
            case "COMMENT" -> {
                // 댓글에 좋아요 -> 댓글이 달린 원본 리소스로 이동
                var commentOpt = commentRepository.findById(id);
                if (commentOpt.isPresent()) {
                    var comment = commentOpt.get();
                    String commentableType = comment.getCommentableType();
                    Long commentableId = comment.getCommentableId();
                    
                    if (commentableType == null || commentableId == null) {
                        log.warn("[LikeNotify] COMMENT id={} has no commentableType/Id", id);
                        yield "/";
                    }
                    
                    // 댓글이 달린 대상에 따라 deepLink 생성
                    String normalizedType = commentableType.toUpperCase();
                    switch (normalizedType) {
                        case "PROJECT": {
                            Long ownerId = projectRepository.findAuthorIdById(commentableId).orElse(null);
                            if (ownerId != null) {
                                yield "/other-project/" + ownerId + "/" + commentableId + "#comment-" + id;
                            }
                            log.warn("[LikeNotify] COMMENT->PROJECT ownerId not found for projectId={}", commentableId);
                            yield "/";
                        }
                        case "CODE_SUBMISSION": {
                            var sub = submissionRepository.findById(commentableId).orElse(null);
                            if (sub != null && sub.getChallenge() != null) {
                                Long chId = sub.getChallenge().getId();
                                yield "/challenge/code/" + chId + "/submissions/" + commentableId + "#comment-" + id;
                            }
                            log.warn("[LikeNotify] COMMENT->CODE_SUBMISSION not found for id={}", commentableId);
                            yield "/";
                        }
                        case "PORTFOLIO_SUBMISSION": {
                            var sub = submissionRepository.findById(commentableId).orElse(null);
                            if (sub != null && sub.getChallenge() != null) {
                                Long chId = sub.getChallenge().getId();
                                yield "/challenge/portfolio/" + chId + "/vote/" + commentableId + "#comment-" + id;
                            }
                            log.warn("[LikeNotify] COMMENT->PORTFOLIO_SUBMISSION not found for id={}", commentableId);
                            yield "/";
                        }
                        default: {
                            log.warn("[LikeNotify] COMMENT->Unknown commentableType={}", commentableType);
                            yield "/";
                        }
                    }
                }
                log.warn("[LikeNotify] COMMENT not found for id={}", id);
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