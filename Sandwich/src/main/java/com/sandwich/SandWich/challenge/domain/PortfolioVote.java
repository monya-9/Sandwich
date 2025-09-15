package com.sandwich.SandWich.challenge.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "portfolio_vote",
        uniqueConstraints = @UniqueConstraint(name="uq_vote_ch_voter", columnNames = {"challenge_id","voter_id"}),
        indexes = {
                @Index(name="idx_vote_challenge", columnList = "challenge_id"),
                @Index(name="idx_vote_submission", columnList = "submission_id")
        }
)
@Check( // 점수 1~5 범위 가드
        name = "chk_vote_score_range",
        constraints = "ui_ux BETWEEN 1 AND 5 " +
                "AND creativity BETWEEN 1 AND 5 " +
                "AND code_quality BETWEEN 1 AND 5 " +
                "AND difficulty BETWEEN 1 AND 5"
)
public class PortfolioVote extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @Column(name = "voter_id", nullable = false)
    private Long voterId;

    @Column(name = "ui_ux", nullable = false)
    private Integer uiUx;

    @Column(name = "creativity", nullable = false)
    private Integer creativity;

    @Column(name = "code_quality", nullable = false)
    private Integer codeQuality;

    @Column(name = "difficulty", nullable = false)
    private Integer difficulty;
}