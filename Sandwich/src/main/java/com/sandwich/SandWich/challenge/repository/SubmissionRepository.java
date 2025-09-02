package com.sandwich.SandWich.challenge.repository;


import com.sandwich.SandWich.challenge.domain.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    boolean existsByChallenge_IdAndOwnerId(Long challengeId, Long ownerId);
    Page<Submission> findByChallenge_Id(Long challengeId, Pageable pageable);
}