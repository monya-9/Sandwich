package com.sandwich.SandWich.challenge.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SubmissionViewQueryService {
    private final RedisUtil redisUtil;

    public long getTotalViewCount(Long submissionId) {
        Long v = redisUtil.getViewCount("viewcount:submission:" + submissionId);
        return v == null ? 0L : v;
    }
}