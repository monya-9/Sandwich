package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.MessageRoom;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRoomRepository extends JpaRepository<MessageRoom, Long> {

    // 두 사용자 조합으로 방 1개 고정
    @Query("""
        SELECT r FROM MessageRoom r
        WHERE (r.user1.id = :a AND r.user2.id = :b)
           OR (r.user1.id = :b AND r.user2.id = :a)
    """)
    Optional<MessageRoom> findBetween(@Param("a") Long a, @Param("b") Long b);
}
