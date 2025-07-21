package com.sandwich.SandWich.social.repository;

import com.sandwich.SandWich.social.domain.Like;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    long countByTargetTypeAndTargetId(LikeTargetType targetType, Long targetId);

    boolean existsByUserAndTargetTypeAndTargetId(User user, LikeTargetType targetType, Long targetId);

    Optional<Like> findByUserAndTargetTypeAndTargetId(User user, LikeTargetType targetType, Long targetId);

}
