package com.sandwich.SandWich.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponse {
    private Long projectId;
    private String title;
    private String description;
    private String image;
    private String tools;
    private String repositoryUrl;
    private String demoUrl;
    private Integer startYear;
    private Integer endYear;
    private Boolean isTeam;
    private Integer teamSize;
    private String coverUrl;
    private String shareUrl;
    private Boolean qrCodeEnabled;
    private String qrImageUrl;
    private String frontendBuildCommand;
    private String backendBuildCommand;
    private Integer portNumber;
    private String extraRepoUrl;
}