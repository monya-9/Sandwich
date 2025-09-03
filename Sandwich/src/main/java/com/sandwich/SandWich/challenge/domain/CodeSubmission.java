package com.sandwich.SandWich.challenge.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "code_submission")
public class CodeSubmission {

    @Id
    @Column(name = "submission_id")
    private Long submissionId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // PK = FK(submission.id)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, length = 120)
    private String entrypoint;  // 예: "app/Main.java", "src/main.py", "npm start"

    @Column(name = "commit_sha", length = 64)
    private String commitSha;   // optional: 7~64자 hex
}