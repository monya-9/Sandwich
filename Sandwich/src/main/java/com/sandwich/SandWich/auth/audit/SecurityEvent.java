package com.sandwich.SandWich.auth.audit;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="security_events", indexes = {
        @Index(name="idx_security_events_user", columnList="userId"),
        @Index(name="idx_security_events_type", columnList="type")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SecurityEvent extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String type; // OTP_ISSUE, OTP_VERIFY_OK, OTP_VERIFY_INVALID, OTP_VERIFY_EXPIRED, OTP_VERIFY_LOCKED, LOGIN_BYPASS ...
    private Long userId;
    private String email;
    private String pendingId;
    private String ip;
    private String ua;
    @Column(columnDefinition = "text")
    private String details;
}
