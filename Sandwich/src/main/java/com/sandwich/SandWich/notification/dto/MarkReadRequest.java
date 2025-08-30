package com.sandwich.SandWich.notification.dto;

import lombok.*;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MarkReadRequest {
    private List<Long> ids;                   // 부분 읽음 처리 대상 id 목록 (없거나 빈 배열이면 0건)
}