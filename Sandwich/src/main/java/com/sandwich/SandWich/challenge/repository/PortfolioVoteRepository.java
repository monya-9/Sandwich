package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.PortfolioVote;
import com.sandwich.SandWich.challenge.repository.projection.VoteSummaryRow;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PortfolioVoteRepository extends JpaRepository<PortfolioVote, Long> {
    interface Agg {
        Long getSubmissionId();
        Long getSumUiUx();
        Long getSumCreativity();
        Long getSumCodeQuality();
        Long getSumDifficulty();
        Long getCnt();
    }
    void deleteByChallenge_Id(Long challengeId);

    @Modifying
    @Query("DELETE FROM PortfolioVote v WHERE v.challenge.id = :challengeId")
    void deleteByChallengeId(@Param("challengeId") Long challengeId);

    @Query("""
      select v.submission.id as submissionId,
             sum(v.uiUx) as sumUiUx,
             sum(v.creativity) as sumCreativity,
             sum(v.codeQuality) as sumCodeQuality,
             sum(v.difficulty) as sumDifficulty,
             count(v) as cnt
      from PortfolioVote v
      where v.challenge.id = :challengeId
      group by v.submission.id
    """)
    List<Agg> aggregateBySubmission(@Param("challengeId") Long challengeId);


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

    boolean existsByChallenge_IdAndVoterId(Long challengeId, Long voterId);

    Optional<PortfolioVote> findByChallenge_IdAndVoterId(Long challengeId, Long voterId);
    // 챌린지별 투표 수
    @Query("select v.challenge.id as chId, count(v.id) as cnt " +
            "from PortfolioVote v where v.challenge.id in :ids group by v.challenge.id")
    List<com.sandwich.SandWich.admin.service.AdminChallengeQueryService.CountRow>
    countByChallengeIds(@Param("ids") List<Long> ids);
}