package com.sandwich.SandWich.project.dto;
import lombok.Getter;

@Getter
public class ProjectRequest {
    private String title;
    private String description;
    private String image;
    private String tools;
    private String repositoryUrl;
    private String demoUrl;
}