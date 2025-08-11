package com.sandwich.SandWich.careerProject.dto;

public record CareerProjectRequest(
        String title,
        String techStack,
        String role,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        String description,
        boolean isRepresentative
) {}
