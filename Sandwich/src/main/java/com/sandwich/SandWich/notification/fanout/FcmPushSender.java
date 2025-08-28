package com.sandwich.SandWich.notification.fanout;


import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "push.fcm", name = "enabled", havingValue = "true")
public class FcmPushSender implements PushSender {


    // 설정에서 생성해둔 bean 주입
    private final FirebaseMessaging firebaseMessaging;

    @Value("${app.web.base-url}")
    private String baseUrl;

    @Override
    public void sendData(Long targetUserId, Map<String, String> data) {
        String token = data.get("_token");
        if (token == null || token.isBlank()) return;

        Notification noti = Notification.builder()
                .setTitle("새 메시지 도착")
                .setBody(buildBody(data))
                .build();

        String link = data.getOrDefault("deepLink", baseUrl);
        WebpushFcmOptions fcmOptions = WebpushFcmOptions.withLink(link);
        WebpushConfig webpush = WebpushConfig.builder()
                .setFcmOptions(fcmOptions)
                .putHeader("TTL", "86400")
                .build();

        Message msg = Message.builder()
                .setToken(token)
                .setNotification(noti)
                .putAllData(stripInternalKeys(data))
                .setWebpushConfig(webpush)
                .build();

        try {
            String id = firebaseMessaging.send(msg);
            log.info("[FCM][OK] targetUser={} tokenTail={} msgId={}",
                    targetUserId, tail(token), id);
        } catch (Exception e) {
            log.warn("[FCM][FAIL] targetUser={} tokenTail={} err={}",
                    targetUserId, tail(token), e.toString());
        }
    }

    private Map<String,String> stripInternalKeys(Map<String,String> m) {
        var copy = new java.util.LinkedHashMap<>(m);
        copy.remove("_token");
        return copy;
    }
    private String tail(String token) { return token.length() > 8 ? token.substring(token.length()-8) : token; }
    private String buildBody(Map<String,String> data) {
        String sender = data.getOrDefault("senderName", "");
        String preview = data.getOrDefault("preview", "");
        if (!sender.isEmpty() && !preview.isEmpty()) return sender + ": " + preview;
        if (!preview.isEmpty()) return preview;
        return "새 메시지가 도착했어요";
    }
}