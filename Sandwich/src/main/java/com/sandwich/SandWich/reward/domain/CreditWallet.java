package com.sandwich.SandWich.reward.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "credit_wallet")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditWallet {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 잔액 기본 0
    @Builder.Default
    @Column(nullable = false)
    private Long balance = 0L;

    // 생성/수정 시각 기본 now
    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
