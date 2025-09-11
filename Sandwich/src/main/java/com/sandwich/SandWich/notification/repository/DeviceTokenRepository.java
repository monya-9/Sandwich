package com.sandwich.SandWich.notification.repository;

import com.sandwich.SandWich.notification.domain.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    // 활성 토큰들 (푸시 발송용)
    List<DeviceToken> findAllByUserIdAndIsActiveTrue(Long userId);

    // 단일 토큰 조회 (등록/해제용)
    Optional<DeviceToken> findByToken(String token);

    boolean existsByToken(String token);

    // 최근 본 시간 갱신(선택)
    @Modifying
    @Query("update DeviceToken d set d.lastSeenAt = :seenAt where d.id = :id")
    int touchLastSeen(@Param("id") Long id, @Param("seenAt") OffsetDateTime seenAt);   // ✅ 수정

    // 같은 유저의 다른 토큰들 비활성화(선택)

    @Modifying
    @Query("update DeviceToken d set d.isActive = false where d.user.id = :userId and d.token <> :token")
    int deactivateOthers(@Param("userId") Long userId, @Param("token") String token);   // ✅ 수정
}