package com.sandwich.SandWich.careerProject.dto;

import com.sandwich.SandWich.careerProject.domain.CareerProject;

public record CareerProjectResponse(
        Long id,
        String title,
        String techStack,
        String role,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        String description,
        boolean isRepresentative
) {
    public static CareerProjectResponse from(CareerProject p) {
        return new CareerProjectResponse(
                p.getId(),
                p.getTitle(),
                p.getTechStack(),
                p.getRole(),
                p.getStartYear(),
                p.getStartMonth(),
                p.getEndYear(),
                p.getEndMonth(),
                p.getDescription(),
                p.isRepresentative()
        );
    }
}