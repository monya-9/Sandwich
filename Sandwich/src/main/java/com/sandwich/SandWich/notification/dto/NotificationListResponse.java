package com.sandwich.SandWich.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationListResponse {
    private List<NotificationItemDTO> items;
    private String nextCursor;                // epochMillis 문자열, 더 없으면 null
}
