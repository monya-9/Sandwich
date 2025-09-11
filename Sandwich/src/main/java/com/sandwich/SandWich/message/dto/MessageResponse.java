package com.sandwich.SandWich.message.dto;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data @Builder
public class MessageResponse {
    private Long messageId;
    private Long roomId;
    private Long senderId;
    private Long receiverId;
    private MessageType type;
    private String content;
    private boolean isRead;

    // 카드형 미러링
    private String companyName;
    private String position;
    private String salary;
    private String location;
    private Boolean isNegotiable;

    private String title;
    private String contact;
    private String budget;
    private String description;

    private String payload;
}