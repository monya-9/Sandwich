package com.sandwich.SandWich.notification.fanout;


import java.util.Map;

public interface EmailSender {
    void sendTemplate(Long targetUserId, String templateId, Map<String, Object> model);
}