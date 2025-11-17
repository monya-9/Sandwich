package com.sandwich.SandWich.challenge.repository;

public interface PortfolioVoteAgg {
    Long getSubmissionId();
    Long getCnt();
    Long getSumUiUx();
    Long getSumCreativity();
    Long getSumCodeQuality();
    Long getSumDifficulty();
}