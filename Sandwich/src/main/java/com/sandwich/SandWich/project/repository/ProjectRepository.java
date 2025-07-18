package com.sandwich.SandWich.project.repository;

import com.sandwich.SandWich.project.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT pr FROM Project pr WHERE pr.user.isDeleted = false")
    List<Project> findAllByUserIsNotDeleted();
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);
}