package com.sandwich.SandWich.notification.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "device_token", uniqueConstraints = @UniqueConstraint(name="uk_device_token", columnNames = "token"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeviceToken extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false, length=16)
    private String platform; // "WEB"

    @Column(nullable=false, columnDefinition="TEXT")
    private String token;

    @Column(nullable=false)
    private boolean isActive;

    @Column(nullable=false)
    private OffsetDateTime lastSeenAt;
}