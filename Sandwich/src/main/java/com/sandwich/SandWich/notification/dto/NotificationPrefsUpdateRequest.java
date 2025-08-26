package com.sandwich.SandWich.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationPrefsUpdateRequest {
    // push
    private Boolean pushMessage;
    private Boolean pushComment;
    private Boolean pushLike;
    private Boolean pushFollow;
    private Boolean pushEvent;
    private Boolean pushWorkDigest;

    // email
    private Boolean emailMessage;
    private Boolean emailComment;
    private Boolean emailLike;
    private Boolean emailFollow;
    private Boolean emailEvent;
    private Boolean emailWorkDigest;
}