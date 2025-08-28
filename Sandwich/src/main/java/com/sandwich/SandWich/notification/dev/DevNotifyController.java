package com.sandwich.SandWich.notification.dev;

import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dev/notify")
public class DevNotifyController {

    private final NotificationPublisher publisher;

    @PostMapping("/echo")
    public Map<String, Object> echo(@RequestParam Long targetUserId,
                                    @RequestParam String event) {
        var payload = NotifyPayload.builder()
                .event(event)
                .actorId(999L)
                .targetUserId(targetUserId)
                .resource(NotifyPayload.Resource.builder().type("TEST").id(1L).build())
                .extra(Map.of("message", "hello from dev"))
                .createdAt(OffsetDateTime.now())
                .build();
        publisher.sendToUser(payload);
        return Map.of("ok", true);
    }
}