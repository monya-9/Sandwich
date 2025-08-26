package com.sandwich.SandWich.notification;

import com.sandwich.SandWich.notification.dto.NotifyPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private final SimpMessagingTemplate template;

    public void sendToUser(NotifyPayload payload) {
        Long userId = payload.getTargetUserId();
        String dest = "/topic/users/" + userId + "/notifications";
        log.info("[NOTIFY][WS] dest={} event={} actor={} resource={}:{}",
                dest, payload.getEvent(), payload.getActorId(),
                payload.getResource() != null ? payload.getResource().getType() : "null",
                payload.getResource() != null ? payload.getResource().getId()   : null);

        template.convertAndSend(dest, payload);
    }
}