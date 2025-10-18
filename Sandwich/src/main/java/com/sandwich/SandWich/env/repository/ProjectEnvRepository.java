package com.sandwich.SandWich.env.repository;

import com.sandwich.SandWich.env.domain.ProjectEnv;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectEnvRepository extends JpaRepository<ProjectEnv, Long> {
    List<ProjectEnv> findByProjectId(Long projectId);
}
