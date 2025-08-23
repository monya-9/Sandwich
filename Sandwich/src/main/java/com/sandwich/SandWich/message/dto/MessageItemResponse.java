package com.sandwich.SandWich.message.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageItemResponse {
    private Long id;
    private String type;
    private String content;      // deleted=true면 "삭제된 메시지입니다"
    private boolean mine;        // sender == me
    private boolean read;        // 수신자 기준 읽음
    private Long senderId;
    private Long receiverId;
    private OffsetDateTime createdAt;
    private boolean deleted;     // 프론트 상태표시 용
}
