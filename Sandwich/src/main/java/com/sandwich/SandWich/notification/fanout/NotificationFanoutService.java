package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

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

    // 테스트/운영 토글 (application-*.properties에서 조절)
    @Value("${push.skip.online-gate:false}")
    private boolean skipOnlineGate;            // true면 online/subscribed 체크 무시

    @Value("${push.debounce.seconds:30}")
    private int debounceSeconds;               // 테스트 시 3~5로 낮추기

    @Value("${push.quiet-hours.enabled:true}")
    private boolean quietHoursEnabled;         // 테스트 시 false로


    /** 이벤트 문자열 -> NotifyKind 매핑 (한 군데에서) */
    public NotifyKind mapEventToKind(String event) {
        if (event == null) return NotifyKind.EVENT;
        switch (event) {
            case "MESSAGE_CREATED":
            case "MESSAGE_RECEIVED": return NotifyKind.MESSAGE;
            case "COMMENT_CREATED":  return NotifyKind.COMMENT;
            case "LIKE_CREATED":     return NotifyKind.LIKE;
            case "FOLLOW_CREATED":   return NotifyKind.FOLLOW;
            case "WORK_DIGEST_READY":return NotifyKind.WORK_DIGEST;
            case "SYSTEM_EVENT":
            case "SYSTEM_BROADCAST":
            default:
                log.warn("[FANOUT] unknown event={}, defaulting to EVENT", event);
                return NotifyKind.EVENT;
        }
    }

    /** 공통 팬아웃 엔트리 포인트 */
    public void fanout(NotifyPayload payload) {
        Long targetUserId = payload.getTargetUserId();
        NotifyKind kind = mapEventToKind(payload.getEvent());

        // 1) WS: 항상 전송
        publisher.sendToUser(payload);

        // 2) PUSH: 정책에 맞게 조건 체크 후 전송
        maybeSendPush(targetUserId, kind, payload);

        // 3) EMAIL: 선호도 허용 시 전송
        if (preferenceChecker.isAllowed(targetUserId, kind, NotifyChannel.EMAIL)) {
            emailSender.sendTemplate(targetUserId, selectTemplate(kind), toEmailModel(payload));
        }
    }
    private void maybeSendPush(Long userId, NotifyKind kind, NotifyPayload p) {
        final String topic = "/topic/users/" + userId + "/notifications";

        // online + 해당 토픽 구독 중이면 스킵
        boolean online = onlineGate.isOnline(userId);
        boolean subbed = onlineGate.isSubscribed(userId, topic);

        // 테스트 토글: online/subbed 강제 무시
        if (skipOnlineGate) { online = false; subbed = false; }

        log.info("[NOTIFY][PUSH][CHK] user={} online={} subbed={} event={}", userId, online, subbed, p.getEvent());
        if (online && subbed) {
            log.info("[NOTIFY][PUSH][SKIP] online+subscribed user={}", userId);
            return;
        }

        // 디바운스 키에 resourceId 포함 → 연속 댓글 테스트가 덜 막힘
        String rid = (p.getResource() != null && p.getResource().getId() != null)
                ? String.valueOf(p.getResource().getId()) : "0";
        // 디바운스(같은 사용자/이벤트 30초)
        String debKey = "notify:" + userId + ":" + p.getEvent();
        if (p.getResource()!=null) {
            debKey += ":" + p.getResource().getType() + ":" + p.getResource().getId();
        }
        if (!debouncer.allow(debKey, Duration.ofSeconds(30))) {
            log.debug("[NOTIFY][PUSH][SKIP] debounce key={}", debKey);
            return;
        }

        // Quiet Hours (KST 23~08)
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

        // 선호도
        if (!preferenceChecker.isAllowed(userId, kind, NotifyChannel.PUSH)) {
            log.info("[NOTIFY][PUSH][SKIP] preference disallow user={} kind={}", userId, kind);
            return;
        }

        // 활성 토큰 조회
        var tokens = tokenRepo.findAllByUserIdAndIsActiveTrue(userId);
        if (tokens.isEmpty()) {
            log.info("[NOTIFY][PUSH][SKIP] no-active-tokens user={}", userId);
            return;
        }

        // FCM data-only 전송 (FcmPushSender가 _token을 사용함)
        for (var dt : tokens) {
            Map<String, String> data = new LinkedHashMap<>();
            data.put("event", safe(p.getEvent()));
            data.put("actorId", String.valueOf(p.getActorId()));
            data.put("targetUserId", String.valueOf(p.getTargetUserId()));

            if (p.getResource() != null) {
                data.put("resource.type", safe(p.getResource().getType()));
                data.put("resource.id", String.valueOf(p.getResource().getId()));
            }
            if (p.getExtra() != null && p.getExtra().get("snippet") != null) {
                data.put("extra.snippet", String.valueOf(p.getExtra().get("snippet")));
            }

            // Comment 쪽에서 이미 title/body 세팅해 주므로 그대로 활용
            data.put("title", safe(p.getTitle()));
            data.put("body",  safe(p.getBody()));
            data.put("deepLink", safe(p.getDeepLink()));
            data.put("createdAt", safe(String.valueOf(p.getCreatedAt())));

            // 내부 전달용: FcmPushSender가 이 토큰으로 보내요
            data.put("_token", dt.getToken());

            log.info("[NOTIFY][PUSH][SEND] user={} tokenTail={} event={} resource={}:{}",
                    userId, tail(dt.getToken()),
                    p.getEvent(),
                    p.getResource() != null ? p.getResource().getType() : "null",
                    p.getResource() != null ? p.getResource().getId()   : null);

            pushSender.sendData(userId, data);
        }
    }

    private Map<String,String> toPushData(NotifyPayload p) {
        // FCM data payload 규격: String-String
        Map<String, String> m = new LinkedHashMap<>();
        m.put("event", safe(p.getEvent()));
        m.put("actorId", String.valueOf(p.getActorId()));
        m.put("targetUserId", String.valueOf(p.getTargetUserId()));
        if (p.getResource()!=null) {
            m.put("resource.type", safe(p.getResource().getType()));
            m.put("resource.id", String.valueOf(p.getResource().getId()));
        }
        if (p.getExtra()!=null) {
            // 필요한 키만 선별해서 넣기(예시는 message/snippet)
            Object msg = p.getExtra().get("message");
            Object sn  = p.getExtra().get("snippet");
            if (msg!=null) m.put("extra.message", String.valueOf(msg));
            if (sn!=null)  m.put("extra.snippet", String.valueOf(sn));
        }
        m.put("createdAt", safe(String.valueOf(p.getCreatedAt())));
        return m;
    }

    private Map<String,Object> toEmailModel(NotifyPayload p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("event", p.getEvent());
        m.put("actorId", p.getActorId());
        m.put("targetUserId", p.getTargetUserId());
        m.put("resource", p.getResource());
        m.put("extra", p.getExtra());
        m.put("createdAt", p.getCreatedAt());
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
        };
    }
    private static String tail(String t){
        if (t == null) return "";
        int n = Math.max(0, t.length() - 8);
        return t.substring(n);
    }

    private String safe(String s) { return s == null ? "" : s; }
}