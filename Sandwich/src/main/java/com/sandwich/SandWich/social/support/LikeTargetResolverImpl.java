package com.sandwich.SandWich.social.support;

import com.sandwich.SandWich.challenge.domain.Submission;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.post.repository.PostRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class LikeTargetResolverImpl implements LikeTargetResolver {

    private final ProjectRepository projectRepo;
    private final PostRepository postRepo;
    private final CommentRepository commentRepo;
    private final SubmissionRepository submissionRepo;

    // IDE 경고 잠재워주기용 기본값(실행 시 @Value로 주입됨)
    @Value("${app.system.user-id:0}")
    private Long systemUserId = 0L;

    @Override
    public Optional<Long> resolveTargetUserId(String type, Long id) {
        if (type == null || id == null) return Optional.empty();
        String t = type.trim().toUpperCase(Locale.ROOT);
        try {
            Optional<Long> authorIdOpt = switch (t) {
                case "PROJECT" -> projectRepo.findAuthorIdById(id);
                case "POST"    -> postRepo.findAuthorIdById(id);
                case "COMMENT" -> commentRepo.findAuthorIdById(id);
                case "CODE_SUBMISSION", "PORTFOLIO_SUBMISSION" ->
                        submissionRepo.findById(id).map(Submission::getOwnerId);
                default -> {
                    log.warn("[LIKE][RESOLVE] unsupported type={} id={}", type, id);
                    yield Optional.empty();
                }
            };

            if (authorIdOpt.isEmpty()) return Optional.empty();

            Long authorId = authorIdOpt.get();
            // 시스템 계정이 작성자면 개인 알림 스킵
            if (systemUserId != null && systemUserId.equals(authorId)) {
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
