package com.sandwich.SandWich.challenge.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name="portfolio_submission")
public class PortfolioSubmission {
    @Id
    @Column(name="submission_id")
    private Long submissionId;
}