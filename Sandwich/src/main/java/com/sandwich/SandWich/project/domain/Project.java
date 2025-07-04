package com.sandwich.SandWich.project.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.challenge.domain.ChallengeOption;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Project extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String title;
    private String image;
    private String description;
    private String tools;
    private String repositoryUrl;
    private String demoUrl;

    @OneToMany(mappedBy = "project")
    private List<Like> likes = new ArrayList<>();

    @OneToMany(mappedBy = "project")
    private List<Hashtag> hashtags = new ArrayList<>();

    @OneToMany(mappedBy = "project")
    private List<ProjectRanking> rankings = new ArrayList<>();

    @OneToMany(mappedBy = "project")
    private List<ChallengeOption> challengeOptions = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectContent> contents = new ArrayList<>();
}