package com.sandwich.SandWich.user.dto;

import java.util.List;

public record AccountSearchItem(
        Long id,
        String nickname,
        String email,
        String avatarUrl,
        Boolean isVerified,
        String position,
        List<ProjectCard> projects
) {
    public record ProjectCard(Long id, String coverUrl) {}
}