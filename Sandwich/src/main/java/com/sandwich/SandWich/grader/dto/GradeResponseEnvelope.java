package com.sandwich.SandWich.grader.dto;

public record GradeResponseEnvelope(
        String requestId,
        String status   // "QUEUED" | "ACCEPTED" 등
) {}