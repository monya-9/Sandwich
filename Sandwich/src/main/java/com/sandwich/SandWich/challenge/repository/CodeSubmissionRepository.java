package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.CodeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Long> {
}