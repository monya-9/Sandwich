package com.sandwich.SandWich.challenge.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.post.domain.Post;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;


@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChallengeOption extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_question_id")
    private ChallengeQuestion challengeQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    private int votesCount;

    @OneToMany(mappedBy = "challengeOption")
    private List<ChallengeVote> challengeVotes = new ArrayList<>();
}
