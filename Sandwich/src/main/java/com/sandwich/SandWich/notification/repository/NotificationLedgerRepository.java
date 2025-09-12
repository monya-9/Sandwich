package com.sandwich.SandWich.notification.repository;

import com.sandwich.SandWich.notification.domain.Notification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationLedgerRepository
        extends JpaRepository<Notification, Long>, NotificationLedgerRepositoryCustom {

    long countByUserIdAndReadFalse(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.read=true " +
            "where n.userId=:uid and n.id in :ids and n.read=false")
    int markReadIn(@Param("uid") Long uid, @Param("ids") List<Long> ids);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.read=true " +
            "where n.userId=:uid and n.read=false")
    int markAllRead(@Param("uid") Long uid);

    @Query(value = "select count(*) from notification_ledger where user_id=:uid and is_read=false", nativeQuery = true)
    long countUnread(@Param("uid") Long userId);
}
