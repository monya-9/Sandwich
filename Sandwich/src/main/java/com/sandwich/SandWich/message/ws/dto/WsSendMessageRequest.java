package com.sandwich.SandWich.message.ws.dto;

import lombok.Data;

@Data
public class WsSendMessageRequest {
    private Long roomId;       // 필수
    private String type;       // GENERAL, EMOJI, JOB_OFFER, PROJECT_OFFER
    private String content;    // GENERAL/EMOJI
    private Long attachmentId; // 첨부형이면 사용(옵션)

    // 카드형 필드(옵션) - send()와 동일 규격로 보냈다면 그대로 사용 가능
    private String companyName;
    private String position;
    private String salary;
    private String location;
    private Boolean isNegotiable;

    private String title;
    private String contact;
    private String budget;
    private String description;
}