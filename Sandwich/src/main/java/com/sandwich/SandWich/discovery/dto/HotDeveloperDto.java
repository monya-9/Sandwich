package com.sandwich.SandWich.discovery.dto;

import java.util.List;

public record HotDeveloperDto(
        Long userId,
        String nickname,
        String position,
        String avatarUrl,
        double trendScore,
        List<ProjectCard> projects
) {
    public record ProjectCard(Long projectId, String coverUrl) {}
}
