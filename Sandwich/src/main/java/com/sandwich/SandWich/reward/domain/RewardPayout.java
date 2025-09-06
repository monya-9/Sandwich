package com.sandwich.SandWich.reward.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "reward_payout",
        uniqueConstraints = @UniqueConstraint(name = "uq_reward_payout_ch_user",
                columnNames = {"challenge_id", "user_id"})
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RewardPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId; // FK 매핑 대신 Long으로 보관 (FK 필요하면 @ManyToOne로 변경)

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long amount;

    @Column
    private Integer rank; // 참가자 공통 지급일 땐 NULL

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}