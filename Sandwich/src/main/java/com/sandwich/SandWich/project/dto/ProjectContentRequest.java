package com.sandwich.SandWich.project.dto;
import com.sandwich.SandWich.project.domain.ContentType;
import lombok.Getter;
import lombok.Setter;

// POST /api/projects/{id}/contents 요청에서 사용

@Getter
@Setter
public class ProjectContentRequest {
    private ContentType type;    // TEXT, IMAGE, VIDEO 등 enum
    private String value;        // 텍스트 or 이미지/영상 URL
    private int order;           // 콘텐츠 순서
}