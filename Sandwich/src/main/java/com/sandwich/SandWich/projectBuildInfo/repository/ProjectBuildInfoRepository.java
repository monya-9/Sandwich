package com.sandwich.SandWich.projectBuildInfo.repository;

import com.sandwich.SandWich.projectBuildInfo.domain.ProjectBuildInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectBuildInfoRepository extends JpaRepository<ProjectBuildInfo, Long> {
    Optional<ProjectBuildInfo> findByProjectId(Long projectId);
}
