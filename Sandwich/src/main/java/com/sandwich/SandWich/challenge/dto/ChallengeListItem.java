package com.sandwich.SandWich.challenge.dto;


import com.sandwich.SandWich.challenge.domain.*;
import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChallengeListItem {
    private Long id;
    private ChallengeType type;
    private String title;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    private OffsetDateTime voteStartAt;
    private OffsetDateTime voteEndAt;
    private ChallengeStatus status;

    public static ChallengeListItem from(Challenge c) {
        return ChallengeListItem.builder()
                .id(c.getId())
                .type(c.getType())
                .title(c.getTitle())
                .startAt(c.getStartAt())
                .endAt(c.getEndAt())
                .voteStartAt(c.getVoteStartAt())
                .voteEndAt(c.getVoteEndAt())
                .status(c.getStatus())
                .build();
    }
}