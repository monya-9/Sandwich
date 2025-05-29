package com.sandwich.SandWich.domain;

import com.sandwich.SandWich.domain.common.BaseEntity;
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

    private String username;

    @Column(nullable = false)
    private String email;

    private String password;

    @Column(nullable = false)
    private String provider;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Profile profile;

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Project> projects = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Comment> comments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "follower")
    private List<Follow> following = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "followed")
    private List<Follow> followers = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Post> posts = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    private List<Notification> notifications = new ArrayList<>();
}
