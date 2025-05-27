package com.sandwich.SandWich.domain;
import com.sandwich.SandWich.domain.common.BaseEntity;
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
    private boolean pickone;
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
}