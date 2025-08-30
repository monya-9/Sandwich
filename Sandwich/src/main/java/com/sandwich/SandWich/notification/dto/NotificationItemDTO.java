package com.sandwich.SandWich.notification.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationItemDTO {
    private Long id;
    private String event;
    private String title;
    private String body;
    private Resource resource;                // { type, id }
    private String deepLink;
    private Map<String, Object> extra;        // JSONB -> Map
    private boolean read;
    private OffsetDateTime createdAt;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Resource {
        private String type;                  // PROJECT | POST | COMMENT | USER | ROOM | ...
        private Long id;
    }
}
