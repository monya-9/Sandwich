package com.sandwich.SandWich.award.dto;

import com.sandwich.SandWich.award.domain.Award;

public record AwardResponse(
        Long id,
        String title,
        String issuer,
        Integer year,
        Integer month,
        String description,
        boolean isRepresentative
) {
    public static AwardResponse from(Award award) {
        return new AwardResponse(
                award.getId(),
                award.getTitle(),
                award.getIssuer(),
                award.getYear(),
                award.getMonth(),
                award.getDescription(),
                award.isRepresentative()
        );
    }
}
