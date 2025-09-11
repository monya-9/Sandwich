package com.sandwich.SandWich.challenge.dto;

import com.sandwich.SandWich.challenge.domain.*;
import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChallengeDetail {
    private Long id;
    private ChallengeType type;
    private String title;
    private String ruleJson;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    private OffsetDateTime voteStartAt;
    private OffsetDateTime voteEndAt;
    private ChallengeStatus status;
    // 원하면 아래 두 줄 추가해서 생성/수정 시간도 반환 가능
    // private OffsetDateTime createdAt;
    // private OffsetDateTime updatedAt;

    public static ChallengeDetail from(Challenge c) {
        return ChallengeDetail.builder()
                .id(c.getId())
                .type(c.getType())
                .title(c.getTitle())
                .ruleJson(c.getRuleJson())
                .startAt(c.getStartAt())
                .endAt(c.getEndAt())
                .voteStartAt(c.getVoteStartAt())
                .voteEndAt(c.getVoteEndAt())
                .status(c.getStatus())
                // .createdAt(c.getCreatedAt())
                // .updatedAt(c.getUpdatedAt())
                .build();
    }
}