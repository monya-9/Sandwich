package com.sandwich.SandWich.admin.store;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name="admin_audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="admin_id", nullable=false)
    private Long adminId;

    @Column(nullable=false, length=60)
    private String action;

    @Column(name="target_type", nullable=false, length=30)
    private String targetType;

    @Column(name="target_id")
    private Long targetId;

    @Column(name="req_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String reqJson;

    public static AdminAuditLog of(Long adminId, String action, String targetType, Long targetId, Object payload) {
        String js = "{}";
        try {
            js = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
        } catch (Exception ignored) {}
        return AdminAuditLog.builder()
                .adminId(adminId).action(action).targetType(targetType).targetId(targetId)
                .reqJson(js).build();
    }
}
