package com.sandwich.SandWich.comment.support;

import java.util.Optional;

public interface CommentTargetResolver {

    /**
     * @param commentableType "Project" | "Post" | "Challenge"
     * @param commentableId   해당 리소스 PK
     * @return 알림 대상 userId (없으면 Optional.empty())
     */
    Optional<Long> resolveTargetUserId(String commentableType, Long commentableId);
}