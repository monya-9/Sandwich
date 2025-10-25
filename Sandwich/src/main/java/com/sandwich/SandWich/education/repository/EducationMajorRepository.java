package com.sandwich.SandWich.education.repository;

import com.sandwich.SandWich.education.domain.EducationMajor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationMajorRepository extends JpaRepository<EducationMajor, Long> {
    List<EducationMajor> findByEducation_Id(Long educationId);
}