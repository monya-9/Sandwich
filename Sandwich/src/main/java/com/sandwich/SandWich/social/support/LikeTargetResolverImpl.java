package com.sandwich.SandWich.social.support;
import com.sandwich.SandWich.post.repository.PostRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.util.Locale;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class LikeTargetResolverImpl implements LikeTargetResolver {

    private final ProjectRepository projectRepo;
    private final PostRepository postRepo;
    private final CommentRepository commentRepo;

    @Value("${app.system.user-id:0}")
    private Long systemUserId;

    @Override
    public Optional<Long> resolveTargetUserId(String type, Long id) {
        if (type == null || id == null) return Optional.empty();
        String t = type.trim().toUpperCase(Locale.ROOT);
        try {
            Optional<Long> authorIdOpt = switch (t) {
                case "PROJECT" -> projectRepo.findAuthorIdById(id);
                case "POST"    -> postRepo.findAuthorIdById(id);
                case "COMMENT" -> commentRepo.findAuthorIdById(id);
                default -> {
                    log.warn("[LIKE][RESOLVE] unsupported type={} id={}", type, id);
                    yield Optional.empty();
                }
            };

            if (authorIdOpt.isEmpty()) return Optional.empty();

            Long authorId = authorIdOpt.get();
            // 시스템 계정이 작성자면 개인 알림 스킵
            if (authorId != null && authorId.equals(systemUserId)) {
                log.debug("[LIKE][RESOLVE] system author -> skip notify (authorId={})", authorId);
                return Optional.empty();
            }
            return Optional.of(authorId);

        } catch (Exception e) {
            log.warn("[LIKE][RESOLVE][ERR] type={} id={} err={}", type, id, e.toString());
            return Optional.empty();
        }
    }
}