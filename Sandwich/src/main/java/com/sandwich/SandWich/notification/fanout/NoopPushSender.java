package com.sandwich.SandWich.notification.fanout;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "push.fcm", name = "enabled",
        havingValue = "false", matchIfMissing = true)
public class NoopPushSender implements PushSender {
    @Override public void sendData(Long targetUserId, Map<String, String> data) {
        log.info("[PUSH/NOOP] skip push target={} data={}", targetUserId, data);
    }
}