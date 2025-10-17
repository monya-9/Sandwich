package com.sandwich.SandWich.challenge.repository;


import com.sandwich.SandWich.admin.service.AdminChallengeQueryService;
import com.sandwich.SandWich.challenge.domain.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    boolean existsByChallenge_IdAndOwnerId(Long challengeId, Long ownerId);
    Page<Submission> findByChallenge_Id(Long challengeId, Pageable pageable);
    // 챌린지별 제출 수
    @Query("select s.challenge.id as chId, count(s.id) as cnt " +
            "from Submission s where s.challenge.id in :ids group by s.challenge.id")
    List<AdminChallengeQueryService.CountRow>
    countByChallengeIds(@Param("ids") List<Long> ids);

    long countByChallenge_Id(Long challengeId);

    @Modifying
    @Query("DELETE FROM Submission s WHERE s.challenge.id = :challengeId")
    void deleteByChallengeId(@Param("challengeId") Long challengeId);

    @Query("SELECT s.id FROM Submission s WHERE s.challenge.id = :challengeId")
    java.util.List<Long> findIdsByChallengeId(@Param("challengeId") Long challengeId);
}
