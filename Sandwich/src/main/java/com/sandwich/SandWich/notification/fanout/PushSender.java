package com.sandwich.SandWich.notification.fanout;

import java.util.Map;

public interface PushSender {
    void sendData(Long targetUserId, Map<String, String> data);
}