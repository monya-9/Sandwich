package com.sandwich.SandWich.user.repository;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 일반 유저 조회 (자동으로 is_deleted = false 조건 적용됨)
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailAndProvider(String email, String provider);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.userPosition up " +
            "LEFT JOIN FETCH up.position " +
            "LEFT JOIN FETCH u.interests ui " +
            "LEFT JOIN FETCH ui.interest " +
            "WHERE u.email = :email")
    Optional<User> findByEmailWithDetails(@Param("email") String email);
}