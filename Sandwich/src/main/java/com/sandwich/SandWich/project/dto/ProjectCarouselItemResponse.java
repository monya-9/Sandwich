package com.sandwich.SandWich.project.dto;

import com.sandwich.SandWich.project.domain.Project;

public record ProjectCarouselItemResponse(
        Long id,
        String title,
        String coverUrl,
        String username
) {
    public ProjectCarouselItemResponse(Project p) {
        this(p.getId(),
                p.getTitle(),
                p.getCoverUrl(),
                p.getUser().isDeleted() ? "탈퇴한 사용자" : p.getUser().getUsername());
    }
}