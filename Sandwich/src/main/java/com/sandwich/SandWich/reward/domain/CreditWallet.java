package com.sandwich.SandWich.reward.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "credit_wallet")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CreditWallet {

    @Id
    @Column(name = "user_id")
    private Long userId;          // 지갑 PK

    @Column(nullable = false)
    private Long balance = 0L;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        var now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}