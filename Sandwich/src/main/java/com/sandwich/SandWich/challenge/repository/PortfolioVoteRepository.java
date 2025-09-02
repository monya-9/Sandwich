package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.PortfolioVote;
import com.sandwich.SandWich.challenge.repository.projection.VoteSummaryRow;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PortfolioVoteRepository extends JpaRepository<PortfolioVote, Long> {

    boolean existsByChallenge_IdAndVoterId(Long challengeId, Long voterId);

    Optional<PortfolioVote> findByChallenge_IdAndVoterId(Long challengeId, Long voterId);

    @Query(value = """
      select
        v.submission_id    as submissionId,
        count(*)           as voteCount,
        avg(v.ui_ux)       as uiUxAvg,
        avg(v.creativity)  as creativityAvg,
        avg(v.code_quality)as codeQualityAvg,
        avg(v.difficulty)  as difficultyAvg,
        (avg(v.ui_ux)+avg(v.creativity)+avg(v.code_quality)+avg(v.difficulty))/4.0 as totalScore
      from portfolio_vote v
      where v.challenge_id = :chId
      group by v.submission_id
      order by totalScore desc, voteCount desc, submissionId asc
      """, nativeQuery = true)
    List<VoteSummaryRow> summarize(@Param("chId") Long challengeId);
}