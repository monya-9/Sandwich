package com.sandwich.SandWich.education.dto;

public record EducationRequest(
        String schoolName,
        String degree,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        String description,
        boolean isRepresentative
) {}
