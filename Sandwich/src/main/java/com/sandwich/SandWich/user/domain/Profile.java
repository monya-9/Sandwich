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

    private String bio;
    private String skills;
    private String github;
    private String linkedin;
    private String profileImage;

    public void updateFrom(UserProfileRequest dto) {
        this.bio = dto.getBio();
        this.skills = dto.getSkills();
        this.github = dto.getGithub();
        this.linkedin = dto.getLinkedin();
        this.profileImage = dto.getProfileImageUrl();
    }
}
