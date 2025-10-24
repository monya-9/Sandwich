package com.sandwich.SandWich.challenge.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;


@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name="submission",
        uniqueConstraints = @UniqueConstraint(name="uq_submission_challenge_owner", columnNames={"challenge_id","owner_id"}),
        indexes = {
                @Index(name="idx_submission_challenge", columnList="challenge_id"),
                @Index(name="idx_submission_ch_owner", columnList="challenge_id, owner_id") // ← 추가
        }
)
public class Submission extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Challenge challenge;

    @Column(name="owner_id", nullable=false)
    private Long ownerId;

    @Column(nullable=false, length=200)
    private String title;

    @Column(name="description", columnDefinition = "text")
    private String desc;

    @Column(name="repo_url")
    private String repoUrl;

    @Column(name="demo_url")
    private String demoUrl;

    @Column(name="cover_url", length = 2048)
    private String coverUrl;

    @Enumerated(EnumType.STRING)
    @Column(name="participation_type", length=10)
    private ParticipationType participationType;

    @Column(name="team_name", length=200)
    private String teamName;

    @Column(name="members_text", columnDefinition = "text")
    private String membersText;

    @Column(name = "extra_json", columnDefinition = "jsonb", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String extraJson = "{}";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    public enum ParticipationType { SOLO, TEAM }
}