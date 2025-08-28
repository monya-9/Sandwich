package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.ChallengeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChallengeQuestionRepository extends JpaRepository<ChallengeQuestion, Long> {
    @Query("select q.user.id from ChallengeQuestion q where q.id = :id")
    Optional<Long> findAuthorIdById(@Param("id") Long id);
}
