package com.sandwich.SandWich.notification.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PushRegisterRequest {
    private String platform; // "WEB"
    private String token;    // FCM registration token
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class PushRegisterResponse {
    private boolean ok;
}