package com.sandwich.SandWich.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;

public class AdminChallengeDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        @NotNull private ChallengeType type;           // PORTFOLIO | CODE
        @NotBlank private String title;
        private String ruleJson;                       // JSON 텍스트 (jsonb)
        @NotNull private OffsetDateTime startAt;
        @NotNull private OffsetDateTime endAt;
        private OffsetDateTime voteStartAt;            // 포트폴리오만
        private OffsetDateTime voteEndAt;
        private ChallengeStatus status;                // 생략시 DRAFT
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PatchReq {
        private ChallengeType type;
        private String title;
        private String ruleJson;
        private OffsetDateTime startAt;
        private OffsetDateTime endAt;
        private OffsetDateTime voteStartAt;
        private OffsetDateTime voteEndAt;
        private ChallengeStatus status;
    }

    public record PublishReq(List<Long> top, Long participant) {}
}