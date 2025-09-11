package com.sandwich.SandWich.comment.support;

import com.sandwich.SandWich.post.repository.PostRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.util.Locale;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentTargetResolverImpl implements CommentTargetResolver {

    private final ProjectRepository projectRepo;
    private final PostRepository postRepo;

    @Value("${app.system.user-id}")
    private Long systemUserId;

    @Override
    public Optional<Long> resolveTargetUserId(String commentableType, Long commentableId) {
        if (commentableType == null || commentableId == null) return Optional.empty();

        String t = commentableType.trim().toLowerCase(Locale.ROOT);
        try {
            switch (t) {
                case "project": {
                    return projectRepo.findAuthorIdById(commentableId);
                }
                case "post": {
                    return postRepo.findAuthorIdById(commentableId);
                }
                case "challenge": {
                    // PR1에서는 챌린지 댓글 대상 미지원: 의존 제거 및 안전한 no-op
                    log.warn("[COMMENT][RESOLVE] challenge target not supported in PR1 (id={})", commentableId);
                    return Optional.empty();
                }
                default: {
                    log.warn("[COMMENT][RESOLVE] unsupported type={} id={}", commentableType, commentableId);
                    return Optional.empty();
                }
            }
        } catch (Exception e) {
            log.warn("[COMMENT][RESOLVE][ERR] type={} id={} err={}", commentableType, commentableId, e.toString());
            return Optional.empty();
        }
    }
}
