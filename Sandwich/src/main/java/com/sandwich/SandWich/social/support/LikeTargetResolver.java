package com.sandwich.SandWich.social.support;

import java.util.Optional;

public interface LikeTargetResolver {
    Optional<Long> resolveTargetUserId(String type, Long targetId);
}