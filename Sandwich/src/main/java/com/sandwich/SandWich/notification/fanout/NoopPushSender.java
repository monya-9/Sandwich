package com.sandwich.SandWich.notification.fanout;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Primary // 나중에 FCM 구현이 들어오면 @Primary 제거/대체
public class NoopPushSender implements PushSender {
    @Override public void sendData(Long targetUserId, Map<String, String> data) {
        log.info("[PUSH/NOOP] skip push target={} data={}", targetUserId, data);
    }
}