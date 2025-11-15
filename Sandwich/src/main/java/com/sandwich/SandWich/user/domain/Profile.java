package com.sandwich.SandWich.user.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.dto.UserProfileRequest;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Profile extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String nickname; // 화면 노출용 이름 (수정 가능)

    @Column(nullable = false, unique = true)
    private String profileSlug; // URL용 slug

    private String bio;
    private String skills;
    private String github;
    private String linkedin;
    private String profileImage;
    private String coverImage;

    public void updateFrom(UserProfileRequest dto) {
        if (dto.getBio() != null) {
            this.bio = dto.getBio();
        }
        if (dto.getSkills() != null) {
            this.skills = dto.getSkills();
        }
        if (dto.getGithub() != null) {
            this.github = dto.getGithub();
        }
        if (dto.getLinkedin() != null) {
            this.linkedin = dto.getLinkedin();
        }
        if (dto.getProfileImageUrl() != null) {
            this.profileImage = dto.getProfileImageUrl();
        }
        if (dto.getNickname() != null) {
            this.nickname = dto.getNickname();
        }
        if (dto.getCoverImageUrl() != null) {
            this.coverImage = dto.getCoverImageUrl();
        }
    }
}
