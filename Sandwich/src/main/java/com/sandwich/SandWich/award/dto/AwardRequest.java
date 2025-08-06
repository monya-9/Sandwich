package com.sandwich.SandWich.award.dto;

public record AwardRequest(
        String title,
        String issuer,
        Integer year,
        Integer month,
        String description,
        boolean isRepresentative
) {}
