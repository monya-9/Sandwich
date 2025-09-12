package com.sandwich.SandWich.challenge.dto;

import com.sandwich.SandWich.challenge.domain.PortfolioVote;
import com.sandwich.SandWich.challenge.repository.projection.VoteSummaryRow;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class VoteDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateOrUpdateReq {
        @NotNull private Long submissionId;
        @Min(1) @Max(5) private int uiUx;
        @Min(1) @Max(5) private int creativity;
        @Min(1) @Max(5) private int codeQuality;
        @Min(1) @Max(5) private int difficulty;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MyVoteResp {
        private Long submissionId;
        private int uiUx, creativity, codeQuality, difficulty;

        public static MyVoteResp from(PortfolioVote v) {
            return MyVoteResp.builder()
                    .submissionId(v.getSubmission().getId())
                    .uiUx(v.getUiUx())
                    .creativity(v.getCreativity())
                    .codeQuality(v.getCodeQuality())
                    .difficulty(v.getDifficulty())
                    .build();
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SummaryItem {
        private Long submissionId;
        private long voteCount;
        private double uiUxAvg, creativityAvg, codeQualityAvg, difficultyAvg, totalScore;

        public static SummaryItem from(VoteSummaryRow r) {
            return SummaryItem.builder()
                    .submissionId(r.getSubmissionId())
                    .voteCount(r.getVoteCount() == null ? 0 : r.getVoteCount())
                    .uiUxAvg(round(r.getUiUxAvg()))
                    .creativityAvg(round(r.getCreativityAvg()))
                    .codeQualityAvg(round(r.getCodeQualityAvg()))
                    .difficultyAvg(round(r.getDifficultyAvg()))
                    .totalScore(round(r.getTotalScore()))
                    .build();
        }
        private static double round(Double v) {
            if (v == null) return 0d;
            return new BigDecimal(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
        }
    }
}