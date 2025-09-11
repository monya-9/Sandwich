package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.CodeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Long> {
    Optional<CodeSubmission> findBySubmission_Id(Long submissionId);
}