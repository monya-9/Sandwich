package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.notification.NotificationPublisher;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationFanoutService {

    private final NotificationPublisher publisher; // WS용
    private final PreferenceChecker preferenceChecker;
    private final PushSender pushSender;   // 현재는 No-op
    private final EmailSender emailSender; // 현재는 No-op

    /** 이벤트 문자열 -> NotifyKind 매핑 (한 군데에서) */
    public NotifyKind mapEventToKind(String event) {
        if (event == null) return null;
        return switch (event) {
            case "MESSAGE_CREATED", "MESSAGE_RECEIVED" -> NotifyKind.MESSAGE;
            case "COMMENT_CREATED"                     -> NotifyKind.COMMENT;
            case "LIKE_CREATED"                        -> NotifyKind.LIKE;
            case "FOLLOW_CREATED"                      -> NotifyKind.FOLLOW;
            case "SYSTEM_EVENT", "SYSTEM_BROADCAST"    -> NotifyKind.EVENT;
            case "WORK_DIGEST_READY"                   -> NotifyKind.WORK_DIGEST;
            default -> {
                log.warn("[FANOUT] unknown event={}, defaulting to EVENT", event);
                yield NotifyKind.EVENT;
            }
        };
    }

    /** 공통 팬아웃 엔트리 포인트 */
    public void fanout(NotifyPayload payload) {
        Long targetUserId = payload.getTargetUserId();
        NotifyKind kind = mapEventToKind(payload.getEvent());

        // 1) WS: 항상 전송
        publisher.sendToUser(payload);

        // 2) PUSH: 선호도 허용 시 전송
        if (preferenceChecker.isAllowed(targetUserId, kind, NotifyChannel.PUSH)) {
            pushSender.sendData(targetUserId, toPushData(payload));
        }

        // 3) EMAIL: 선호도 허용 시 전송
        if (preferenceChecker.isAllowed(targetUserId, kind, NotifyChannel.EMAIL)) {
            emailSender.sendTemplate(targetUserId, selectTemplate(kind), toEmailModel(payload));
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

    private String safe(String s) { return s == null ? "" : s; }
}