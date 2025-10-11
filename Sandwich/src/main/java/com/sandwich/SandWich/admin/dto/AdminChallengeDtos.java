package com.sandwich.SandWich.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
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

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ListItem {
        private Long id;
        private ChallengeType type;
        private String title;
        private ChallengeStatus status;
        private OffsetDateTime startAt;
        private OffsetDateTime endAt;
        private OffsetDateTime voteStartAt;
        private OffsetDateTime voteEndAt;
        private long submissionCount;
        private long voteCount;
    }


    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Overview {
        private Long id;
        private ChallengeType type;
        private String title;
        private ChallengeStatus status;
        private OffsetDateTime startAt;
        private OffsetDateTime endAt;
        private OffsetDateTime voteStartAt;
        private OffsetDateTime voteEndAt;
        private String ruleJson;
        private long submissionCount;
        private long voteCount;
    }


    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class SubmissionItem {
        private Long id;
        private Long ownerId;
        private String title;
        private String repoUrl;
        private String demoUrl;
        private String desc;
        private String status;
        private int assetCount;
        private BigDecimal totalScore; // null 가능
        private OffsetDateTime createdAt;
    }


    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class VoteSummaryItem {
        private Long submissionId;
        private long voteCount;
        private double uiUxAvg;
        private double creativityAvg;
        private double codeQualityAvg;
        private double difficultyAvg;
        private double totalScore;
    }
}