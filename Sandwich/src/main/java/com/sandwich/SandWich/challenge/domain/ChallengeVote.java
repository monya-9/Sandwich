package com.sandwich.SandWich.challenge.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChallengeVote extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_option_id")
    private ChallengeOption challengeOption;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_question_id")
    private ChallengeQuestion challengeQuestion;

    private float responseTime;
}
