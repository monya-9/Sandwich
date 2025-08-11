package com.sandwich.SandWich.message.domain;

import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageRoom extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 방은 정확히 2인 고정(1:1)
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    // 정렬 및 목록용(옵션) — 마지막 메시지 내용/타입/시간
    private String lastMessagePreview;
    @Enumerated(EnumType.STRING)
    private MessageType lastMessageType;
}