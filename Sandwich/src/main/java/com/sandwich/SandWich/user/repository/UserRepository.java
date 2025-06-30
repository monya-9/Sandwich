package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 일반 유저 조회 (자동으로 is_deleted = false 조건 적용됨)
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailAndProvider(String email, String provider);
    boolean existsByEmail(String email);

    // 예외적으로 탈퇴 포함 전체 유저 조회가 필요하면 ↓ 이런 식으로 따로 @Query 사용
}