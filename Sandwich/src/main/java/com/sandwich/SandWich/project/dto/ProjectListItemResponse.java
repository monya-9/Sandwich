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
    private final String shareUrl;       // 예: https://sandwich.com/테스트유저1/1
    private final String qrImageUrl;     // S3에 업로드된 QR 이미지 주소
    private final Owner owner;


    @Getter
    public static class Owner {
        private final Long id;
        private final String nickname;  // Profile.nickname 우선
        private final String email;
        private final String avatarUrl; // Profile.profileImage
        private final String username;

        public Owner(User u) {
            this.id = u.getId();
            this.nickname = u.getNickname();
            this.email = u.getEmail();
            this.avatarUrl = u.getProfileImageUrl();
            this.username = u.getUsername();
        }
    }

    public ProjectListItemResponse(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        this.coverUrl = project.getCoverUrl();
        this.isTeam = project.getIsTeam();
        this.shareUrl = project.getShareUrl();
        this.qrImageUrl = project.getQrImageUrl();

        User ownerEntity = project.getUser();
        boolean deleted = (ownerEntity != null && Boolean.TRUE.equals(ownerEntity.isDeleted()));

        // 프런트 요구: username 그대로, 탈퇴 사용자는 표기만 변경
        this.username = (ownerEntity == null)
                ? null
                : (deleted ? "탈퇴한 사용자" : ownerEntity.getUsername());

        // 탈퇴 계정의 민감정보 노출 방지: owner 블록은 null
        this.owner = (ownerEntity == null || deleted) ? null : new Owner(ownerEntity);
    }
}
