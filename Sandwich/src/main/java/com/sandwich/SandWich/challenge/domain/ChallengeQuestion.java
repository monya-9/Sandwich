package com.sandwich.SandWich.challenge.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChallengeQuestion extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String question;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
    private Integer roundNumber;
    private String slug;

    @OneToMany(mappedBy = "challengeQuestion")
    private List<ChallengeOption> challengeOptions = new ArrayList<>();

    @OneToMany(mappedBy = "challengeQuestion")
    private List<ChallengeVote> challengeVotes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false) // 작성자
    private User user;
}