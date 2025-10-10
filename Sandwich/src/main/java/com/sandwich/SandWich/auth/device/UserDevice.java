package com.sandwich.SandWich.auth.device;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDevice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK

    @Column(nullable = false)
    private Long userId; // 소유자 (users.id)

    @Column(nullable = false, unique = true)
    private String deviceId; // 랜덤 UUID(쿠키 tdid) — 디바이스 식별자

    @Column(nullable = false)
    private String deviceSecretHash; // 쿠키 tdt의 bcrypt 해시

    private String uaHash; // User-Agent 해시 (브라우저/앱 구분용)
    private String lastIp; // 마지막 로그인 시 IP

    @Column(length = 64)
    private String deviceName; // 사용자가 지정한 디바이스 이름

    private OffsetDateTime trustUntil; // 신뢰 만료 시점 (예: 30일 후)
    private OffsetDateTime revokedAt;  // 강제 해제된 시점 (로그아웃/보안조치 등)
}
