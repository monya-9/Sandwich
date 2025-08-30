package com.sandwich.SandWich.notification.repository;

import com.sandwich.SandWich.notification.domain.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    @Modifying
    @Query("update DeviceToken d set d.lastSeenAt = :seenAt where d.id = :id")
    int touchLastSeen(@Param("id") Long id, @Param("seenAt") OffsetDateTime seenAt);

    @Modifying
    @Query("update DeviceToken d set d.isActive = false where d.user.id = :userId and d.token <> :token")
    int deactivateOthers(@Param("userId") Long userId, @Param("token") String token);
}