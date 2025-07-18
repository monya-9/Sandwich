package com.sandwich.SandWich.project.dto;

import com.sandwich.SandWich.project.domain.Project;
import lombok.Getter;

@Getter
public class ProjectListItemResponse {
    private final Long id;
    private final String title;
    private final String description;
    private final String coverUrl;
    private final Boolean isTeam;

    public ProjectListItemResponse(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        this.coverUrl = project.getCoverUrl();
        this.isTeam = project.getIsTeam();
    }
}
