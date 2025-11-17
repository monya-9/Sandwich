package com.sandwich.SandWich.project.dto;

import com.sandwich.SandWich.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponse {
    private Long projectId;
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
    private String shareUrl;
    private Boolean qrCodeEnabled;
    private Boolean deployEnabled;
    private String qrImageUrl;
    private String frontendBuildCommand;
    private String backendBuildCommand;
    private Integer portNumber;
    private String extraRepoUrl;
    
    // GitHub 설정 정보 (배포용)
    private String githubOwner;
    private String githubRepo;
    private String githubBaseBranch;
    
    private Owner owner;

    @Getter
    public static class Owner {
        private final Long id;
        private final String nickname;
        private final String email;
        private final String avatarUrl;
        private final String username;

        public Owner(User u) {
            this.id = u.getId();
            this.nickname = u.getNickname();
            this.email = u.getEmail();
            this.avatarUrl = u.getProfileImageUrl();
            this.username = u.getUsername();
        }
    }
}