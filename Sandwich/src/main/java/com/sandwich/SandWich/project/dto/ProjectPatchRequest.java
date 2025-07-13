package com.sandwich.SandWich.project.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProjectPatchRequest {
    private String title;
    private String description;
    private String tools;
    private String frontendBuildCommand;
    private String backendBuildCommand;
    private Integer portNumber;
    private String snsUrl;
    private List<ProjectContentRequest> contents; // 콘텐츠 전체 교체 or 일부 수정
}