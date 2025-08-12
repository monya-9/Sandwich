package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE Message m
       SET m.isRead = true
     WHERE m.room.id = :roomId
       AND m.receiver.id = :meId
       AND m.isRead = false
""")
    int markAsRead(@Param("roomId") Long roomId, @Param("meId") Long meId);

}