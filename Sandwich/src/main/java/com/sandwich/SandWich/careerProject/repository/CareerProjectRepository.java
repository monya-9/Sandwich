package com.sandwich.SandWich.careerProject.repository;

import com.sandwich.SandWich.careerProject.domain.CareerProject;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerProjectRepository extends JpaRepository<CareerProject, Long> {
    List<CareerProject> findByUser(User user);
    List<CareerProject> findByUserAndIsRepresentativeTrue(User user);
}
