package com.sandwich.SandWich.project.repository;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT pr FROM Project pr WHERE pr.user.isDeleted = false")
    List<Project> findAllByUserIsNotDeleted();
    List<Project> findByUser(User user);
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.id = :projectId AND p.user.id = :userId AND p.user.isDeleted = false")
    Optional<Project> findByIdAndUserId(Long projectId, Long userId);

    @Query("select p.user.id from Project p where p.id = :id")
    Optional<Long> findAuthorIdById(@Param("id") Long id);

}