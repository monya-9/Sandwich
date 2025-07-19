package com.sandwich.SandWich.project.dto;
import lombok.*;


@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {
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
    private String frontendBuildCommand;
    private String backendBuildCommand;
    private Integer portNumber;
    private String extraRepoUrl;
}