package com.sandwich.SandWich.project.dto;

import com.sandwich.SandWich.project.domain.ContentType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProjectContentDto {
    private Long id;
    private ContentType type;
    private String data;
    private int order;
} 