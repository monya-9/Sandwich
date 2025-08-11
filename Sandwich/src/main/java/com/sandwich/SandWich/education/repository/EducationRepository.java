package com.sandwich.SandWich.education.repository;

import com.sandwich.SandWich.education.domain.Education;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Long> {
    List<Education> findByUser(User user);
    List<Education> findByUserAndIsRepresentativeTrue(User user);
}
