package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.common.util.TimeUtil;
import com.sandwich.SandWich.notification.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageFanoutHelper {

    private final OnlineGate onlineGate;
    private final DeviceTokenRepository tokenRepo;
    private final PushSender pushSender;
    private final PreferenceChecker preferenceChecker;
    private final Debouncer debouncer;


    public void maybeSendWebPush(Long targetUserId,
                                 Long roomId,
                                 String senderName,
                                 String preview,
                                 Map<String,String> extraData) {


        log.info("[FANOUT] target={} room={} online={} subbed={} preview={}",
                targetUserId, roomId,
                onlineGate.isOnline(targetUserId),
                onlineGate.isSubscribed(targetUserId, "/topic/rooms/" + roomId),
                preview);

        // 1) 실시간 구독 중이면 스킵
        boolean online = onlineGate.isOnline(targetUserId);
        boolean subscribed = onlineGate.isSubscribed(targetUserId, "/topic/rooms/" + roomId);
        if (online && subscribed) {
            log.info("[FANOUT][SKIP] online+subscribed: user={} room={}", targetUserId, roomId);
            return;
        }

        // 2) 디바운스: 같은 방/유저에 너무 자주 안 보내도록
        if (! debouncer.allow("push:"+targetUserId+":room:"+roomId, Duration.ofSeconds(30))) {
            log.debug("[FANOUT] debounce skip user={} room={}", targetUserId, roomId);
            return;
        }

        // 3) Quiet Hours (예: 23:00 ~ 08:00 KST는 미발송)
        if (isQuietNow(targetUserId)) {
            log.info("[FANOUT] quiet hours skip user={} room={}", targetUserId, roomId);
            return;
        }

        // 4) 선호도 검사 (사용자 설정)
        if (!preferenceChecker.isAllowed(targetUserId, NotifyKind.MESSAGE, NotifyChannel.PUSH)) return;

        // 5) 실제 전송
        var tokens = tokenRepo.findAllByUserIdAndIsActiveTrue(targetUserId);
        for (var dt : tokens) {
            var data = new LinkedHashMap<String,String>();
            data.put("type", "MESSAGE");
            data.put("roomId", String.valueOf(roomId));
            data.put("messageId", extraData.getOrDefault("messageId", ""));
            data.put("deepLink", "/rooms/" + roomId);
            data.put("senderName", senderName);
            data.put("preview", preview);
            data.put("createdAt", TimeUtil.nowUtc().toString());
            data.put("_token", dt.getToken()); // 내부 전달용

            pushSender.sendData(targetUserId, data);
        }
    }

    private boolean isQuietNow(Long userId) {
        // 모든 유저 동일 정책 (23:00~08:00 KST)
        ZonedDateTime nowKst = ZonedDateTime.now(TimeUtil.Z_KST);
        int hour = nowKst.getHour();
        return (hour >= 23 || hour < 8);
    }


}