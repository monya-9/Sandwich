
package com.sandwich.SandWich.message.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull
    private Long targetUserId;     // 상대방 (roomId 없이 전송 시 필수)

    @NotNull
    private MessageType type;      // GENERAL / JOB_OFFER / PROJECT_OFFER / EMOJI

    // 공통
    private String content;        // GENERAL/EMOJI 본문 (EMOJI는 😊 같은 유니코드)

    // JOB_OFFER
    private String companyName;
    private String position;
    private String salary;     // isNegotiable=true면 무시
    private String location;
    private Boolean isNegotiable;  // 카드 공통

    // PROJECT_OFFER
    private String title;
    private String contact;
    private String budget;     // 무조건 필수(서버에서 검증)
    private String description; // 카드 공통 설명
}
