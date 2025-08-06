package com.sandwich.SandWich.representative.dto;

public record RepresentativeCareerResponse(
        String type,        // "CAREER", "EDUCATION", "AWARD", "PROJECT"
        String title,       // 항목 제목
        String subtitle,    // 회사명, 학교명, 기관명, 기술스택 등
        String description  // 설명
) {}