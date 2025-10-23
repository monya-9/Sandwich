package com.sandwich.SandWich.challenge.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(callSuper = true)
@Entity @Table(name="submission_asset",
        indexes = @Index(name="idx_asset_submission", columnList="submission_id")
)
public class SubmissionAsset extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Submission submission;

    @Column(nullable=false)
    private String url;

    private String mime;
}