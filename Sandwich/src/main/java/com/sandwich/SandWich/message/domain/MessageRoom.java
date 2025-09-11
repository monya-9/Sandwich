package com.sandwich.SandWich.message.domain;

import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(indexes = {
        @Index(name = "idx_room_lastmsgat_desc", columnList = "lastMessageAt DESC")
})
public class MessageRoom extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 방은 정확히 2인 고정(1:1)
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    // 기존 목록 프리뷰(선택) — 계속 유지해도 됨
    @Column(columnDefinition = "text")
    private String lastMessagePreview;

    @Enumerated(EnumType.STRING)
    private MessageType lastMessageType;


    // 추가: 목록 정렬/조인 최적화용
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "last_message_id")
    private Message lastMessage;

    @Column(name = "last_message_at")
    private OffsetDateTime lastMessageAt;

    @PrePersist
    public void onCreate() {
        if (lastMessageAt == null) lastMessageAt = OffsetDateTime.now();
    }

    // 편의 메서드: 상대 찾기
    public User partnerOf(User me) {
        if (user1.getId().equals(me.getId())) return user2;
        if (user2.getId().equals(me.getId())) return user1;
        throw new IllegalArgumentException("사용자는 이 방의 멤버가 아닙니다.");
    }
}