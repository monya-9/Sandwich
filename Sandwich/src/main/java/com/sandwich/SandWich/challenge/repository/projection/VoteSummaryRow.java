package com.sandwich.SandWich.challenge.repository.projection;

public interface VoteSummaryRow {
    Long   getSubmissionId();
    Long   getVoteCount();
    Double getUiUxAvg();
    Double getCreativityAvg();
    Double getCodeQualityAvg();
    Double getDifficultyAvg();
    Double getTotalScore();
}