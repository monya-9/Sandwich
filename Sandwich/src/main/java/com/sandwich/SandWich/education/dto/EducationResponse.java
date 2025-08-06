package com.sandwich.SandWich.education.dto;

import com.sandwich.SandWich.education.domain.Education;

public record EducationResponse(
        Long id,
        String schoolName,
        String degree,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        String description,
        boolean isRepresentative
) {
    public static EducationResponse from(Education e) {
        return new EducationResponse(
                e.getId(),
                e.getSchoolName(),
                e.getDegree(),
                e.getStartYear(),
                e.getStartMonth(),
                e.getEndYear(),
                e.getEndMonth(),
                e.getDescription(),
                e.isRepresentative()
        );
    }
}
