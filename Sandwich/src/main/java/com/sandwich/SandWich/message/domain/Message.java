package com.sandwich.SandWich.message.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import com.vladmihalcea.hibernate.type.json.JsonType;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(indexes = {
        @Index(name = "idx_msg_room_created", columnList = "room_id, createdAt DESC"),
        @Index(name = "idx_msg_unread", columnList = "room_id, receiver_id, is_read")
})
public class Message extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "room_id", nullable = false)
    private MessageRoom room;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    // GENERAL/EMOJI 본문, 카드형은 description 등 일부 필드만 미리보기용으로 넣어도 됨
    @Column(columnDefinition = "text")
    private String content;

    @org.hibernate.annotations.Type(JsonType.class)
    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    private boolean isRead = false;

    // --- 카드형(채용/프로젝트) 전용 필드 (NULL 허용) ---
    private String companyName;   // JOB_OFFER
    private String position;      // JOB_OFFER
    private String salary;        // JOB_OFFER
    private String location;      // JOB_OFFER
    private Boolean isNegotiable; // JOB_OFFER, PROJECT_OFFER 공통

    private String title;     // PROJECT_OFFER
    private String contact;   // PROJECT_OFFER
    private String budget;    // PROJECT_OFFER
    private String cardDescription; // JOB_OFFER, PROJECT_OFFER 공통

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;           // 마스킹 여부
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;     // 삭제(마스킹) 시각
    @Column(name = "deleted_by_user_id")
    private Long deletedByUserId;        // 누가 삭제했는지
}
