package com.sandwich.SandWich.challenge.synclog;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "challenge_sync_log")
public class ChallengeSyncLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="created_at", nullable=false)
    private OffsetDateTime createdAt;

    @PrePersist void pre() { if (createdAt == null) createdAt = OffsetDateTime.now(); }

    @Column(nullable=false, length=20)
    private String actorType;      // ADMIN | SERVICE | MACHINE

    private Long actorId;          // ADMIN일 때만

    @Column(nullable=false, length=20)
    private String method;         // BATCH | FETCH_MONTHLY | ...

    @Column(length=7)  private String aiMonth;
    @Column(length=8)  private String aiWeek;
    @Column(length=120) private String idempotencyKey;

    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb")
    private com.fasterxml.jackson.databind.JsonNode requestJson;

    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb")
    private com.fasterxml.jackson.databind.JsonNode resultJson;

    @Column(nullable=false, length=20)
    private String status;         // SUCCESS | PARTIAL | FAILED

    @Column(columnDefinition = "text")
    private String message;

    private Integer createdCount;
    private Integer updatedCount;
    private Integer skippedCount;
    private Integer errorCount;
}