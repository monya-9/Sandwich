package com.sandwich.SandWich.grader.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record GradeCallbackRequest(
        String requestId,          // ex) "sub-123"
        Long submissionId,
        Integer passed,
        Integer failed,
        BigDecimal coverage,
        String logsUrl,
        String aiComment,
        Map<String,Object> scoreDetail, // 자유 JSON
        BigDecimal totalScore,
        Instant gradedAt            // (옵션)
) {}