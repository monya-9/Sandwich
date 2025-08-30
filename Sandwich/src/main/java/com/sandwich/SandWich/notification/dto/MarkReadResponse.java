package com.sandwich.SandWich.notification.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MarkReadResponse {
    private long updated;                     // 실제 업데이트된 건수
    private long unreadCount;                 // 갱신 후 미읽음 카운트
}