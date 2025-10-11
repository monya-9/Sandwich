package com.sandwich.SandWich.challenge.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionViewService {
    private final RedisUtil redisUtil;
    private static final long TTL_HOURS = 1;

    public void handleSubmissionView(Long submissionId, Long ownerId,
                                     @org.springframework.lang.Nullable Long viewerId,
                                     jakarta.servlet.http.HttpServletRequest req) {
        if (viewerId != null && viewerId.equals(ownerId)) return; // 자기 것은 제외
        String dupKey = (viewerId != null)
                ? "view:submission:%d:user:%d".formatted(submissionId, viewerId)
                : "view:submission:%d:ip:%s:ua:%s".formatted(
                submissionId,
                com.sandwich.SandWich.common.util.Hashes.sha256(req.getRemoteAddr()),
                com.sandwich.SandWich.common.util.Hashes.sha256(req.getHeader("User-Agent"))
        );
        if (redisUtil.hasKey(dupKey)) return;
        redisUtil.incrementViewCount("viewcount:submission:" + submissionId);
        redisUtil.setDuplicateTTLKey(dupKey, TTL_HOURS, java.util.concurrent.TimeUnit.HOURS);
    }
}