package com.sandwich.SandWich.notification.domain;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.Map;

@Entity
@Table(name = "notification_ledger")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 주쿼리 키: userId */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 조회용 보조 연관: 값 쓰기는 userId가 담당 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    /** ★ 배우(행위자) */
    @Column(name = "actor_id")
    private Long actorId;

    /** 쓰지는 않지만 쿼리 최적화 시 사용할 수도 있음 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", insertable = false, updatable = false)
    private User actor;

    /** 기존 type → event */
    @Column(name = "event", nullable = false, length = 64)
    private String event;

    @Column(name = "resource_type", nullable = false, length = 32)
    private String resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(nullable = false, length = 200)
    private String title;

    /** 기존 message → body(길이 확장) */
    @Column(nullable = false, length = 500)
    private String body;

    @Column(name = "deep_link", nullable = false, length = 300)
    private String deepLink;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> extra;

    /** is_read 컬럼에 매핑 (JPQL/롬복 호환 위해 필드명은 read 권장) */
    @Column(name = "is_read", nullable = false)
    private boolean read;
}
