package com.sandwich.SandWich.notification.dto;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UnreadCountResponse {
    private long unreadCount;
}