package com.sandwich.SandWich.project.dto;

public record ProjectViewDto(
        Long projectId,
        String title,
        Integer count,
        java.time.OffsetDateTime lastViewedAt
) {}