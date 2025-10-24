package com.sandwich.SandWich.challenge.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "code_submission")
public class CodeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getSubmissionId() {
        return submission != null ? submission.getId() : null;
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Submission submission;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, length = 120)
    private String entrypoint;  // 예: "app/Main.java", "src/main.py", "npm start"

    @Column(name = "commit_sha", length = 64)
    private String commitSha;   // optional: 7~64자 hex
}