package com.sandwich.SandWich.challenge.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChallengeQuestion extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String question;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer roundNumber;
    private String slug;

    @OneToMany(mappedBy = "challengeQuestion")
    private List<ChallengeOption> challengeOptions = new ArrayList<>();

    @OneToMany(mappedBy = "challengeQuestion")
    private List<ChallengeVote> challengeVotes = new ArrayList<>();
}