package com.sandwich.SandWich.project.repository;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.domain.ProjectView;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProjectViewRepository extends JpaRepository<ProjectView, Long> {
    Optional<ProjectView> findByProjectAndViewer(Project project, User viewer);

    @Query("SELECT COALESCE(SUM(pv.count), 0) FROM ProjectView pv WHERE pv.project.id = :projectId")
    Long sumViewCountByProjectId(@Param("projectId") Long projectId);
}
