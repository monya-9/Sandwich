package com.sandwich.SandWich.challenge.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(callSuper = true)
@Entity @Table(name="submission",
        uniqueConstraints = @UniqueConstraint(name="uq_submission_challenge_owner", columnNames={"challenge_id","owner_id"}),
        indexes = @Index(name="idx_submission_challenge", columnList="challenge_id")
)
public class Submission extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="challenge_id", nullable=false)
    private Challenge challenge;

    @Column(name="owner_id", nullable=false)
    private Long ownerId;

    @Column(nullable=false, length=200)
    private String title;

    @Column(columnDefinition = "text")
    private String descr;

    @Column(name="repo_url")
    private String repoUrl;

    @Column(name="demo_url")
    private String demoUrl;

    @Column(name = "extra_json", columnDefinition = "jsonb", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String extraJson = "{}";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;
}