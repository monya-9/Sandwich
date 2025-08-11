package com.sandwich.SandWich.career.dto;

import com.sandwich.SandWich.career.domain.Career;

public record CareerResponse(
        Long id,
        String role,
        String companyName,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        boolean isWorking,
        String description,
        boolean isRepresentative
) {
    public static CareerResponse from(Career career) {
        return new CareerResponse(
                career.getId(),
                career.getRole(),
                career.getCompanyName(),
                career.getStartYear(),
                career.getStartMonth(),
                career.getEndYear(),
                career.getEndMonth(),
                career.isWorking(),
                career.getDescription(),
                career.isRepresentative()
        );
    }
}