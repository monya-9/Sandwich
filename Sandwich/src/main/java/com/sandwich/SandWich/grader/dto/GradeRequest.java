package com.sandwich.SandWich.grader.dto;

import java.time.Instant;
import java.util.Map;

public record GradeRequest(
        String requestId,
        Long submissionId,
        Long challengeId,
        String language,
        String entrypoint,
        Repo repo,
        Limits limits,
        Callback callback,
        Instant requestedAt,
        Map<String, Object> meta
) {
    public record Repo(String url, String commitSha) {}
    public record Limits(Integer timeoutSec, Integer memoryMb, Integer cpu) {}
    public record Callback(String url, Auth auth) {
        public record Auth(String type, String keyId) {}
    }
}
