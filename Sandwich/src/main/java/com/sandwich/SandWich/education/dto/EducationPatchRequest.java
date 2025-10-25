package com.sandwich.SandWich.education.dto;

public record EducationPatchRequest(
        String schoolName,
        String degree,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        String description,
        Boolean isRepresentative,
        String level,
        String status
) {}