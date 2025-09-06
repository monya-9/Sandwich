package com.sandwich.SandWich.grader.dto;

import lombok.Builder;

@Builder
public record GradeRequestPreview(
        String requestId,
        String timestamp,
        String canonical,
        String signature,
        String bodySha256,
        String body
) {}