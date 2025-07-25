package com.sandwich.SandWich.user.repository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.domain.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {
    List<UserInterest> findByUser(User user);  // 유저 기준 관심분야 목록 조회
    void deleteByUser(User user);
}