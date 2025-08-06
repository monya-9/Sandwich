package com.sandwich.SandWich.career.repository;

import com.sandwich.SandWich.career.domain.Career;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareerRepository extends JpaRepository<Career, Long> {
    List<Career> findByUser(User user);
    List<Career> findByUserAndIsRepresentativeTrue(User user);
}
