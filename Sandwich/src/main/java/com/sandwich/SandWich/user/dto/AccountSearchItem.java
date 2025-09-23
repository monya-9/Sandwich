package com.sandwich.SandWich.user.dto;

import java.util.List;

public record AccountSearchItem(
        Long id,
        String nickname,
        String email,
        String avatarUrl,
        Boolean isVerified,
        String position,
        List<ProjectIdOnly> projects
) {
    public record ProjectIdOnly(Long id) {}
}