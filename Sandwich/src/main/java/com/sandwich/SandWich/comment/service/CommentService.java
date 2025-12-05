package com.sandwich.SandWich.comment.service;

import com.sandwich.SandWich.comment.domain.Comment;
import com.sandwich.SandWich.comment.dto.CommentRequest;
import com.sandwich.SandWich.comment.dto.CommentResponse;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.comment.support.CommentTargetResolver;
import com.sandwich.SandWich.notification.events.CommentCreatedEvent;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final ApplicationEventPublisher events;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CommentTargetResolver targetResolver;

    @Transactional
    public void create(CommentRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        Comment comment = Comment.builder()
                .user(user)
                .commentableType(request.getCommentableType())
                .commentableId(request.getCommentableId())
                .comment(request.getComment())
                .build();

        if (request.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글 없음"));
            comment.setParentComment(parent);
        }

        commentRepository.save(comment);

        // ===== 알림 이벤트 발행 =====
        String resourceType = request.getCommentableType();
        Long resourceId = request.getCommentableId();

        if (resourceType == null) {
            log.warn("[COMMENT][EVENT] resourceType is null. commentableId={}", resourceId);
            return; // 타입이 없으면 알림 발행 안 함
        }

        String normalizedType = resourceType.toUpperCase(Locale.ROOT);

        targetResolver.resolveTargetUserId(resourceType, resourceId)
                .filter(tid -> !tid.equals(userId)) // 자기 자신이면 스킵
                .ifPresent(tid -> {
                    String snippet = makeSnippet(comment.getComment(), 80);
                    events.publishEvent(new CommentCreatedEvent(
                            userId,
                            normalizedType,
                            resourceId,
                            tid,
                            snippet
                    ));
                    log.info("[COMMENT][EVENT] actor={} target={} type={} id={} snippet={}",
                            userId, tid, normalizedType, resourceId, snippet);
                });
    }

    private String makeSnippet(String s, int max) {
        if (s == null) return "";
        s = s.trim();
        return (s.length() <= max) ? s : s.substring(0, max) + "…";
    }

    @Transactional
    public void update(Long commentId, String content, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글 없음"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 댓글만 수정 가능");
        }
        comment.setComment(content);
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글 없음"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 댓글만 삭제 가능");
        }
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String type, Long id) {
        List<Comment> comments = commentRepository
                .findByCommentableTypeAndCommentableIdAndParentCommentIsNullOrderByCreatedAtDesc(type, id);
        return comments.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .comment(comment.getComment())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getNickname())
                .profileImageUrl(comment.getUser().getProfileImageUrl())
                .createdAt(comment.getCreatedAt())
                .subComments(comment.getSubComments().stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .build();
    }
}
