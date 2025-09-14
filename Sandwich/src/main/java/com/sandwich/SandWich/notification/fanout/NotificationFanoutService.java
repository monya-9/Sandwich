package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.repository.DeviceTokenRepository;
import com.sandwich.SandWich.notification.service.NotificationLedgerService;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationFanoutService {

    private final NotificationPublisher publisher;   // WS 전송
    private final PreferenceChecker preferenceChecker;
    private final OnlineGate onlineGate;
    private final Debouncer debouncer;
    private final DeviceTokenRepository tokenRepo;
    private final PushSender pushSender;
    private final EmailSender emailSender; // 현재는 No-op
    private final NotificationLedgerService ledgerService;

    // ★ 배우 조회용
    private final UserRepository userRepo;

    @Value("${push.skip.online-gate:false}")
    private boolean skipOnlineGate;

    @Value("${push.debounce.seconds:30}")
    private int debounceSeconds;

    @Value("${push.quiet-hours.enabled:true}")
    private boolean quietHoursEnabled;

    public NotifyKind mapEventToKind(String event) {
        if (event == null) return NotifyKind.EVENT;
        switch (event) {
            case "MESSAGE_CREATED":
            case "MESSAGE_RECEIVED": return NotifyKind.MESSAGE;
            case "COMMENT_CREATED":  return NotifyKind.COMMENT;
            case "LIKE_CREATED":     return NotifyKind.LIKE;
            case "FOLLOW_CREATED":   return NotifyKind.FOLLOW;
            case "WORK_DIGEST_READY":return NotifyKind.WORK_DIGEST;
            case "COLLECTION_SAVED": return NotifyKind.COLLECTION;
            case "SYSTEM_EVENT":
            case "SYSTEM_BROADCAST":
            default:
                log.warn("[FANOUT] unknown event={}, defaulting to EVENT", event);
                return NotifyKind.EVENT;
        }
    }

    /** 공통 팬아웃 엔트리 포인트 */
    public void fanout(NotifyPayload payload) {
        // ★ 배우 필드 enrich (가능하면)
        payload = enrichActor(payload);

        // 0) 레저 저장
        ledgerService.saveFromPayload(payload);

        // 1) WS
        publisher.sendToUser(payload);

        // 2) PUSH
        Long targetUserId = payload.getTargetUserId();
        maybeSendPush(targetUserId, mapEventToKind(payload.getEvent()), payload);

        // 3) EMAIL (옵션)
        if (preferenceChecker.isAllowed(targetUserId, mapEventToKind(payload.getEvent()), NotifyChannel.EMAIL)) {
            emailSender.sendTemplate(targetUserId, selectTemplate(mapEventToKind(payload.getEvent())), toEmailModel(payload));
        }
    }

    /** 배우(행위자) 정보를 payload에 채워넣는다. */
    private NotifyPayload enrichActor(NotifyPayload p) {
        if (p.getActorId() == null) return p;

        var views = userRepo.findActorViewsByIds(Set.of(p.getActorId()));
        if (views.isEmpty()) return p;

        var av = views.get(0);
        return NotifyPayload.builder()
                .event(p.getEvent())
                .actorId(p.getActorId())
                .targetUserId(p.getTargetUserId())
                .resource(p.getResource())
                .extra(p.getExtra())
                .createdAt(p.getCreatedAt())
                .deepLink(p.getDeepLink())
                .title(p.getTitle())
                .body(p.getBody())
                // ★ 배우 필드
                .actorNickname(av.getNickname())
                .actorEmail(av.getEmail())
                .actorProfileUrl(av.getProfileImage())
                .build();
    }

    private void maybeSendPush(Long userId, NotifyKind kind, NotifyPayload p) {
        final String topic = "/topic/users/" + userId + "/notifications";

        boolean online = onlineGate.isOnline(userId);
        boolean subbed = onlineGate.isSubscribed(userId, topic);
        if (skipOnlineGate) { online = false; subbed = false; }

        log.info("[NOTIFY][PUSH][CHK] user={} online={} subbed={} event={}", userId, online, subbed, p.getEvent());
        if (online && subbed) {
            log.info("[NOTIFY][PUSH][SKIP] online+subscribed user={}", userId);
            return;
        }

        String debKey = "notify:" + userId + ":" + p.getEvent();
        if (p.getResource()!=null) debKey += ":" + p.getResource().getType() + ":" + p.getResource().getId();
        if (!debouncer.allow(debKey, Duration.ofSeconds(debounceSeconds))) {
            log.debug("[NOTIFY][PUSH][SKIP] debounce key={}", debKey);
            return;
        }

        if (quietHoursEnabled) {
            ZonedDateTime nowKst = ZonedDateTime.now(com.sandwich.SandWich.common.util.TimeUtil.Z_KST);
            int h = nowKst.getHour();
            boolean quiet = (h >= 23 || h < 8);
            log.info("[NOTIFY][PUSH][CHK] quietHours={} (KST hour={})", quiet, h);
            if (quiet) {
                log.info("[NOTIFY][PUSH][SKIP] quiet-hours user={}", userId);
                return;
            }
        }

        if (!preferenceChecker.isAllowed(userId, kind, NotifyChannel.PUSH)) {
            log.info("[NOTIFY][PUSH][SKIP] preference disallow user={} kind={}", userId, kind);
            return;
        }

        var tokens = tokenRepo.findAllByUserIdAndIsActiveTrue(userId);
        if (tokens.isEmpty()) {
            log.info("[NOTIFY][PUSH][SKIP] no-active-tokens user={}", userId);
            return;
        }

        for (var dt : tokens) {
            Map<String, String> data = new LinkedHashMap<>();
            data.put("event", safe(p.getEvent()));
            data.put("actorId", String.valueOf(p.getActorId()));
            // ★ 배우 필드 추가
            if (p.getActorNickname() != null)   data.put("actorNickname", p.getActorNickname());
            if (p.getActorEmail() != null)      data.put("actorEmail", p.getActorEmail());
            if (p.getActorProfileUrl() != null) data.put("actorProfileUrl", p.getActorProfileUrl());

            data.put("targetUserId", String.valueOf(p.getTargetUserId()));
            if (p.getResource() != null) {
                data.put("resource.type", safe(p.getResource().getType()));
                data.put("resource.id", String.valueOf(p.getResource().getId()));
            }
            if (p.getExtra() != null && p.getExtra().get("snippet") != null) {
                data.put("extra.snippet", String.valueOf(p.getExtra().get("snippet")));
            }
            data.put("title", safe(p.getTitle()));
            data.put("body",  safe(p.getBody()));
            data.put("deepLink", safe(p.getDeepLink()));
            data.put("createdAt", safe(String.valueOf(p.getCreatedAt())));
            data.put("_token", dt.getToken());

            log.info("[NOTIFY][PUSH][SEND] user={} tokenTail={} event={} resource={}:{}",
                    userId, tail(dt.getToken()),
                    p.getEvent(),
                    p.getResource() != null ? p.getResource().getType() : "null",
                    p.getResource() != null ? p.getResource().getId()   : null);

            pushSender.sendData(userId, data);
        }
    }

    private Map<String,Object> toEmailModel(NotifyPayload p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("event", p.getEvent());
        m.put("actorId", p.getActorId());
        m.put("actorNickname", p.getActorNickname());
        m.put("actorEmail", p.getActorEmail());
        m.put("actorProfileUrl", p.getActorProfileUrl());
        m.put("targetUserId", p.getTargetUserId());
        m.put("resource", p.getResource());
        m.put("extra", p.getExtra());
        m.put("createdAt", p.getCreatedAt());
        m.put("title", p.getTitle());
        m.put("body", p.getBody());
        m.put("deepLink", p.getDeepLink());
        return m;
    }

    private String selectTemplate(NotifyKind kind) {
        return switch (kind) {
            case MESSAGE     -> "tpl_message_created";
            case COMMENT     -> "tpl_comment_created";
            case LIKE        -> "tpl_like_created";
            case FOLLOW      -> "tpl_follow_created";
            case EVENT       -> "tpl_system_event";
            case WORK_DIGEST -> "tpl_work_digest";
            case COLLECTION  -> "tpl_collection_saved";
        };
    }
    private static String tail(String t){
        if (t == null) return "";
        int n = Math.max(0, t.length() - 8);
        return t.substring(n);
    }
    private String safe(String s) { return s == null ? "" : s; }
}
