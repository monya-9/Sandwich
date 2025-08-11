package com.sandwich.SandWich.award.repository;

import com.sandwich.SandWich.award.domain.Award;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AwardRepository extends JpaRepository<Award, Long> {
    List<Award> findByUser(User user);
    List<Award> findByUserAndIsRepresentativeTrue(User user);
}
