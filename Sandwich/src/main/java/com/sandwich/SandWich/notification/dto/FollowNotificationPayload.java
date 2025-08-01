package com.sandwich.SandWich.notification.dto;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowNotificationPayload {
    private Long senderId;
    private String nickname;
    private String profileImg;
    private String link;
}
