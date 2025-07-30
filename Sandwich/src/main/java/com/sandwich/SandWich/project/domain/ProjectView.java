package com.sandwich.SandWich.project.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "project_views", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "viewer_id"})
})
public class ProjectView extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 프로젝트
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // 조회자 (nullable: 비회원도 가능)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewer_id")
    private User viewer;

    @Builder.Default
    @Column(nullable = false)
    private Integer count = 1;

    @Builder.Default
    @Column(name = "viewed_at", nullable = false)
    private java.time.LocalDateTime viewedAt = java.time.LocalDateTime.now();

    public void increaseCount() {
        this.count++;
        this.viewedAt = java.time.LocalDateTime.now();
    }
}
