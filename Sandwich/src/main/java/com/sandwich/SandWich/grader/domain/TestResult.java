package com.sandwich.SandWich.grader.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "test_result", uniqueConstraints = {
        @UniqueConstraint(name="uk_testresult_submission", columnNames = "submission_id")
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class TestResult {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="submission_id", nullable = false, unique = true)
    private Long submissionId;

    private Integer passed;
    private Integer failed;

    @Column(precision = 5, scale = 2)
    private BigDecimal coverage;

    @Column(name="logs_url")
    private String logsUrl;

    @Column(name="ai_comment")
    private String aiComment;

    @Column(name="score_detail_json", columnDefinition = "jsonb")
    private String scoreDetailJson; // 저장은 문자열(JSON)로

    @Column(name="total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name="created_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @UpdateTimestamp
    @Column(name="updated_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime updatedAt;
}
