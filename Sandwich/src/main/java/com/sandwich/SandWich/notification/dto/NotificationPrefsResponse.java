package com.sandwich.SandWich.notification.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPrefsResponse {
    // push
    private boolean pushMessage;
    private boolean pushComment;
    private boolean pushLike;
    private boolean pushFollow;
    private boolean pushEvent;
    private boolean pushWorkDigest;

    // email
    private boolean emailMessage;
    private boolean emailComment;
    private boolean emailLike;
    private boolean emailFollow;
    private boolean emailEvent;
    private boolean emailWorkDigest;
}