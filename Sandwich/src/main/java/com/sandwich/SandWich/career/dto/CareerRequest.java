package com.sandwich.SandWich.career.dto;

public record CareerRequest(
        String role,
        String companyName,
        Integer startYear,
        Integer startMonth,
        Integer endYear,
        Integer endMonth,
        boolean isWorking,
        String description,
        boolean isRepresentative
) {}