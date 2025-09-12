package com.sandwich.SandWich.challenge.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import jakarta.persistence.Index;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "challenge",
        indexes = {
                @Index(name = "idx_challenge_type_status", columnList = "type,status"),
                @Index(name = "idx_challenge_start_at", columnList = "start_at")
        }
)
@Check(constraints =
        "start_at < end_at AND (" +
                " (vote_start_at IS NULL AND vote_end_at IS NULL) OR " +
                " (vote_start_at IS NOT NULL AND vote_end_at IS NOT NULL AND end_at <= vote_start_at AND vote_start_at < vote_end_at)" +
                ")"
)
public class Challenge extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType type;

    @Column(nullable = false, length = 200)
    private String title;

    /** DB는 jsonb, 여기서는 raw JSON string 으로 보관 */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rule_json", columnDefinition = "jsonb")
    private JsonNode ruleJson;

    @Column(name = "start_at", nullable = false)
    private OffsetDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private OffsetDateTime endAt;

    @Column(name = "vote_start_at")
    private OffsetDateTime voteStartAt;

    @Column(name = "vote_end_at")
    private OffsetDateTime voteEndAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeStatus status = ChallengeStatus.DRAFT;
}
