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

    // 테스트 때만 true
    @Value("${push.web.fallback-notification:false}")
    private boolean fallback;

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
        clean.putIfAbsent("title", "새 알림");
        // body 우선순위: 내려온 body -> extra.snippet -> preview -> 기본 문구
        String body = clean.get("body");
        if (body == null || body.isBlank()) {
            String snippet = clean.getOrDefault("extra.snippet", "");
            if (!snippet.isBlank()) body = snippet;
        }
        if (body == null || body.isBlank()) {
            body = clean.getOrDefault("preview", "");
        }
        if (body == null || body.isBlank()) {
            body = "새 알림이 도착했어요";
        }
        clean.put("body", body);

        // 3) 딥링크 기본값(절대경로 보장)
        String deepLink = clean.get("deepLink");
        if (deepLink == null || deepLink.isBlank()) deepLink = "/";
        if (deepLink.startsWith("/")) {
            String base = baseUrl == null ? "" : baseUrl.replaceAll("/+$","");
            deepLink = base + deepLink;
        }
        clean.put("deepLink", deepLink);

        // 4) WebPush 구성: 기본은 data-only, 테스트 모드에서만 notification 폴백 추가
        WebpushConfig.Builder webpushB = WebpushConfig.builder()
                .setFcmOptions(WebpushFcmOptions.withLink(deepLink))
                .putHeader("TTL", "86400");

        if (fallback) { // 폴백 알림(테스트/트러블슈팅용)
            WebpushNotification notif = WebpushNotification.builder()
                    .setTitle(clean.get("title"))
                    .setBody(clean.get("body"))
                    // .setIcon("/icons/icon-192.png") // 있으면 사용
                    // .setBadge("/icons/badge-72.png")
                    .build();
            webpushB.setNotification(notif);
        }

        Message msg = Message.builder()
                .setToken(token)
                .putAllData(clean)                 // data는 항상 유지(운영 data-only용)
                .setWebpushConfig(webpushB.build())
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