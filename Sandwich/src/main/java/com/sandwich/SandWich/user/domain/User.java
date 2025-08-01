package com.sandwich.SandWich.user.domain;

import com.sandwich.SandWich.notification.domain.Notification;
import com.sandwich.SandWich.comment.domain.Comment;
import com.sandwich.SandWich.post.domain.Post;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.social.domain.Follow;
import jakarta.persistence.*;
import lombok.*;

import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username; // 자동 생성, 수정 불가

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false)
    private String provider;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isVerified = false;

    @Builder.Default
    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Profile profile;

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Project> projects = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Comment> comments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Follow> followings = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Follow> followers = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Post> posts = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Notification> notifications = new ArrayList<>();

    // 1:1 포지션
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserPosition userPosition;

    // N:3 관심 분야
    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<UserInterest> interests = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private Role role = Role.ROLE_USER;

    @Builder.Default
    @Column(name = "is_profile_set")
    private Boolean isProfileSet = false;

    public void setIsDeleted(boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public void setUsername(String username) {
        if (this.username != null && !this.username.equals(username)) {
            throw new IllegalStateException("username은 수정할 수 없습니다.");
        }
        this.username = username;
    }

    public String getNickname() {
        return profile != null ? profile.getNickname() : null;
    }

    public String getProfileImageUrl() {
        return profile != null ? profile.getProfileImage() : null;
    }
}
