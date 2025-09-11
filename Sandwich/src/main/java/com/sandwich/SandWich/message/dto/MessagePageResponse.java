package com.sandwich.SandWich.message.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessagePageResponse {
    private List<MessageItemResponse> items;
    private Long nextCursorId;   // 다음 페이지: ?cursorId=이값
    private boolean hasNext;
}