package com.sandwich.SandWich.project.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProjectResponse {
    private Long projectId;
    private String previewUrl; // 예: username.sandwich.com 형식
}
