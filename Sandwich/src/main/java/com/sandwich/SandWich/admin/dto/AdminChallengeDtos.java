package com.sandwich.SandWich.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLog;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AdminChallengeDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        private Integer selectedIdx;
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
        private Integer selectedIdx;
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

//    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
//    public static class ListItem {
//        private Long id;
//        private ChallengeType type;
//        private String title;
//        private ChallengeStatus status;
//        private OffsetDateTime startAt;
//        private OffsetDateTime endAt;
//        private OffsetDateTime voteStartAt;
//        private OffsetDateTime voteEndAt;
//        private long submissionCount;
//        private long voteCount;
//    }


    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Overview {
        private Long id;
        private Integer selectedIdx;
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

    @Getter @Setter @Builder
    public static class ListItem {
        Long id; ChallengeType type; String title;
        OffsetDateTime startAt, endAt, voteStartAt, voteEndAt;
        ChallengeStatus status;
        String source, aiMonth, aiWeek, idempotencyKey;
        long submissionCount;
        long voteCount;
        Integer selectedIdx;
        public static ListItem from(Challenge c) {
            return ListItem.builder()
                    .id(c.getId()).type(c.getType()).title(c.getTitle())
                    .startAt(c.getStartAt()).endAt(c.getEndAt())
                    .voteStartAt(c.getVoteStartAt()).voteEndAt(c.getVoteEndAt())
                    .status(c.getStatus())
                    .source(c.getSource()).aiMonth(c.getAiMonth()).aiWeek(c.getAiWeek())
                    .idempotencyKey(c.getIdempotencyKey())
                    .selectedIdx(c.getSelectedIdx())
                    .build();
        }
    }
    @Getter @Setter @Builder
    public static class Detail {
        ListItem challenge;
        ChallengeSyncLog latestSync; // 요약 표시용
    }
}