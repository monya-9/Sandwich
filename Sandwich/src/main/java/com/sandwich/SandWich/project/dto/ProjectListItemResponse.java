package com.sandwich.SandWich.project.dto;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.user.domain.User;
import lombok.Getter;

@Getter
public class ProjectListItemResponse {
    private final Long id;
    private final String title;
    private final String description;
    private final String coverUrl;
    private final Boolean isTeam;
    private final String username;
    private String shareUrl;       // 예: https://sandwich.com/테스트유저1/1
    private String qrImageUrl;     // S3에 업로드된 QR 이미지 주소


    public ProjectListItemResponse(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        this.coverUrl = project.getCoverUrl();
        this.isTeam = project.getIsTeam();

        this.username = project.getUser().isDeleted()
                ? "탈퇴한 사용자"
                : project.getUser().getUsername();

        this.shareUrl = project.getShareUrl();
        this.qrImageUrl = project.getQrImageUrl();
    }
}
