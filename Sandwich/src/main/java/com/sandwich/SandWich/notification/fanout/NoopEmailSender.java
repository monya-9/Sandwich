package com.sandwich.SandWich.notification.fanout;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Primary
public class NoopEmailSender implements EmailSender {
    @Override public void sendTemplate(Long targetUserId, String templateId, Map<String, Object> model) {
        log.info("[EMAIL/NOOP] skip email target={} tpl={} model={}", targetUserId, templateId, model);
    }
}