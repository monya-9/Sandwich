package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.domain.UserPosition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPositionRepository extends JpaRepository<UserPosition, Long> {
    Optional<UserPosition> findByUser(User user);  // 유저 기준 포지션 조회

    void deleteByUser(User user);
}

