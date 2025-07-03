package com.sandwich.SandWich.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
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
    private String snsUrl;
    private Boolean qrCodeEnabled;
    private String qrImageUrl;
}