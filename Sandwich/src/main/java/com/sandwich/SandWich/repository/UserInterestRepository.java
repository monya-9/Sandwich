package com.sandwich.SandWich.repository;
import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.domain.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {
    List<UserInterest> findByUser(User user);  // 유저 기준 관심분야 목록 조회
}