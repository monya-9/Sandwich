package com.sandwich.SandWich.collection.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummary {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private int likeCount;
    private int viewCount;
    private int commentCount;
    private Long ownerId; // 프로젝트 작성자 ID
}

