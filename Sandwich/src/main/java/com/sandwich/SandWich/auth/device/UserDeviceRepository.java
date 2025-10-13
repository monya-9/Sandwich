package com.sandwich.SandWich.auth.device;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {

    Optional<UserDevice> findByDeviceIdAndRevokedAtIsNull(String deviceId);

    List<UserDevice> findByUserIdAndRevokedAtIsNull(Long userId);

    Optional<UserDevice> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndRevokedAtIsNull(Long userId);

    @Modifying
    @Query("update UserDevice d set d.revokedAt = :now where d.userId = :userId and d.revokedAt is null")
    int revokeAllActiveByUserId(@Param("userId") Long userId, @Param("now") OffsetDateTime now);
}
