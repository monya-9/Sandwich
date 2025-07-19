package com.sandwich.SandWich.project.repository;

import com.sandwich.SandWich.project.domain.ProjectContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectContentRepository extends JpaRepository<ProjectContent, Long> {
}