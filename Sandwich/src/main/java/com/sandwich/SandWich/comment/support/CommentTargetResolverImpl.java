package com.sandwich.SandWich.comment.support;

import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.challenge.domain.Submission; // ⬅ 추가
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
    private final SubmissionRepository submissionRepo;

    @Value("${app.system.user-id:0}")
    private Long systemUserId; // 사용 안 해도 OK (경고 피하려면 :0 기본값)

    @Override
    public Optional<Long> resolveTargetUserId(String commentableType, Long commentableId) {
        if (commentableType == null || commentableId == null) return Optional.empty();

        String t = commentableType.trim().toLowerCase(Locale.ROOT);
        try {
            switch (t) {
                case "project": {
                    return projectRepo.findAuthorIdById(commentableId);
                }
                case "code_submission": {
                    return submissionRepo.findById(commentableId).map(Submission::getOwnerId);
                }
                case "portfolio_submission": {
                    return submissionRepo.findById(commentableId).map(Submission::getOwnerId);
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
