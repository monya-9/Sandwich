package com.sandwich.SandWich.social.repository;

import com.sandwich.SandWich.social.domain.Like;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;


public interface LikeRepository extends JpaRepository<Like, Long> {

    long countByTargetTypeAndTargetId(LikeTargetType targetType, Long targetId);

    boolean existsByUserAndTargetTypeAndTargetId(User user, LikeTargetType targetType, Long targetId);

    Optional<Like> findByUserAndTargetTypeAndTargetId(User user, LikeTargetType targetType, Long targetId);

    @EntityGraph(attributePaths = "user")
    Page<Like> findAllByTargetTypeAndTargetId(LikeTargetType targetType, Long targetId, Pageable pageable);

    Page<Like> findAllByUserAndTargetType(User user, LikeTargetType targetType, Pageable pageable);

    @Modifying
    @Transactional
    @Query("delete from Like l where l.targetType = :type and l.targetId in :ids")
    void deleteByTargetTypeAndTargetIdIn(@Param("type") LikeTargetType type,
                                         @Param("ids") java.util.Collection<Long> ids);

}
