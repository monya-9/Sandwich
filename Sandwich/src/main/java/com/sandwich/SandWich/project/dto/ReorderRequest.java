package com.sandwich.SandWich.project.dto;

import lombok.Getter;

@Getter
public class ReorderRequest {
    private Long contentId;
    private int order;
}