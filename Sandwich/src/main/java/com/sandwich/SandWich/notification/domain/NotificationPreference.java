package com.sandwich.SandWich.notification.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preference",
        uniqueConstraints = @UniqueConstraint(name = "uk_notipref_user", columnNames = "user_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) // User 1:1
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Push 채널 (모바일/브라우저 푸시)
    @Column(nullable = false) private boolean pushMessage;     // 기본 on
    @Column(nullable = false) private boolean pushComment;     // 기본 on
    @Column(nullable = false) private boolean pushLike;        // 정책 (예: off)
    @Column(nullable = false) private boolean pushFollow;      // 기본 on
    @Column(nullable = false) private boolean pushEvent;       // 정책 (예: off)
    @Column(nullable = false) private boolean pushWorkDigest;  // 정책 (예: off)

    // Email 채널 (웹만이면 우선 false)
    @Column(nullable = false) private boolean emailMessage;     // 기본 false
    @Column(nullable = false) private boolean emailComment;     // 기본 false
    @Column(nullable = false) private boolean emailLike;        // 기본 false
    @Column(nullable = false) private boolean emailFollow;      // 기본 false
    @Column(nullable = false) private boolean emailEvent;       // 기본 false
    @Column(nullable = false) private boolean emailWorkDigest;  // 기본 false
}