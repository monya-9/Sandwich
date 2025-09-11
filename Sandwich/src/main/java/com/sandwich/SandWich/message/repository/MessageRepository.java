package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE Message m
       SET m.isRead = true
     WHERE m.room.id = :roomId
       AND m.receiver.id = :meId
       AND m.isRead = false""")
    int markAsRead(@Param("roomId") Long roomId, @Param("meId") Long meId);

    @Query("""
    SELECT m FROM Message m
     JOIN FETCH m.sender s
    WHERE m.room.id = :roomId
    ORDER BY m.createdAt ASC""")
    java.util.List<Message> findAllByRoomIdOrderByCreatedAtAsc(@Param("roomId") Long roomId);


    @Query("select m from Message m join fetch m.room where m.id = :id")
    Optional<Message> findWithRoomById(@Param("id") Long id);

    @Query("""
     select m from Message m
     where m.room.id = :roomId and m.isDeleted = false
     order by m.createdAt desc""")
    List<Message> findLatestNotDeletedByRoomId(@Param("roomId") Long roomId, Pageable pageable);

    @Query("""
        SELECT m
        FROM Message m
        JOIN FETCH m.sender s
        JOIN FETCH m.receiver r
        WHERE m.room.id = :roomId
          AND (:cursorId IS NULL OR m.id < :cursorId)
        ORDER BY m.id DESC""")
    List<Message> findSliceByRoomIdAndCursor(
            @Param("roomId") Long roomId,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    Message findTopByRoomIdOrderByIdDesc(Long roomId);

    Optional<Message> findBySenderIdAndRoomIdAndClientNonce(Long senderId, Long roomId, String clientNonce);
}