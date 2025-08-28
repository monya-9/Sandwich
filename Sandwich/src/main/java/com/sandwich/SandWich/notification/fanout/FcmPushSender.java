package com.sandwich.SandWich.notification.fanout;

import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.LinkedHashMap;
import java.util.Map;
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "push.fcm.enabled", havingValue = "true")
public class FcmPushSender implements PushSender {

    private final FirebaseMessaging firebaseMessaging;

    @Value("${app.web.base-url}")
    private String baseUrl; // 예: http://localhost

    @Override
    public void sendData(Long targetUserId, Map<String, String> data) {
        final String token = data.get("_token");
        if (token == null || token.isBlank()) return;

        // 1) 값 보정 + 내부키 제거
        Map<String, String> clean = new LinkedHashMap<>();
        for (var e : data.entrySet()) {
            if (e.getKey() == null) continue;
            if ("_token".equals(e.getKey())) continue; // 클라로 안 보냄
            clean.put(e.getKey(), e.getValue() == null ? "" : e.getValue());
        }

        // 2) 표시용 title/body를 data에 함께 넣어준다(서비스워커에서 사용)
        clean.putIfAbsent("title", "새 메시지 도착");
        String body = clean.getOrDefault("preview", "");
        String sender = clean.getOrDefault("senderName", "");
        if (!sender.isBlank() && !body.isBlank()) body = sender + ": " + body;
        if (body.isBlank()) body = "메시지가 도착했어요";
        clean.put("body", body);

        // 3) 딥링크 기본값(절대경로 보장)
        String deepLink = clean.get("deepLink");
        if (deepLink == null || deepLink.isBlank()) deepLink = "/";
        if (deepLink.startsWith("/")) deepLink = baseUrl.replaceAll("/+$","") + deepLink;
        clean.put("deepLink", deepLink);

        // 4) WebPush 옵션만 설정 (data-only)
        WebpushConfig webpush = WebpushConfig.builder()
                .setFcmOptions(WebpushFcmOptions.withLink(deepLink))
                .putHeader("TTL", "86400")
                // .putHeader("Urgency", "normal")  // 필요시
                .build();

        Message msg = Message.builder()
                .setToken(token)
                .putAllData(clean)
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

    private static String tail(String t) {
        if (t == null) return "";
        int n = Math.max(0, t.length() - 8);
        return t.substring(n);
    }
}