package com.sandwich.SandWich.challenge.notify;

import com.sandwich.SandWich.challenge.ChallengeAutoNotifyProperties;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.fanout.PushSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChallengeLifecycleFanout {

    private final SimpMessagingTemplate ws;      // 선택: 없으면 생성자 주입에서 빈 미존재 처리
    private final PushSender pushSender;         // 선택
    private final ServiceAccountNotifier serviceNotifier; // 네가 쓰는 DB 기반 알림

    private final ChallengeAutoNotifyProperties props;

    // 상태 전환 커밋 후 알림
    @TransactionalEventListener
    public void on(ChallengeLifecycleEvent e) {
        if (!props.isEnabled()) return;
        try {
            switch (e.next()) {
                case OPEN -> broadcast(e, "CHALLENGE_OPENED", "챌린지가 시작됐어요");
                case VOTING -> {
                    if (e.type() == ChallengeType.PORTFOLIO) {
                        broadcast(e, "VOTE_OPENED", "투표가 시작됐어요");
                    }
                }
                case ENDED -> broadcast(e, "CHALLENGE_ENDED", "챌린지가 종료됐어요");
                default -> {}
            }
        } catch (Exception ex) {
            log.warn("[CH-FANOUT] notify failed id={} next={} err={}", e.challengeId(), e.next(), ex.toString());
        }
    }

    private void broadcast(ChallengeLifecycleEvent e, String event, String title) {
        // 필요시 대상/페이로드 확장
        NotifyPayload payload = NotifyPayload.builder()
                .event(event)
                .actorId(null)
                .targetUserId(null) // 다수에게 뿌릴거면 채널 브로드캐스트만
                .resource(new NotifyPayload.Resource("CHALLENGE", e.challengeId()))
                .deepLink("/challenges/" + e.challengeId())
                .title(title)
                .body(e.type() + " / " + e.next())
                .extra(Map.of("challengeId", e.challengeId(), "status", e.next().name()))
                .createdAt(OffsetDateTime.now())
                .build();

        // WS – 공개 채널 (예: /topic/challenges/{id})
        if (ws != null) ws.convertAndSend("/topic/challenges/" + e.challengeId(), payload);

        // ServiceNotification 기록(시스템 계정에)
        if (serviceNotifier != null) {
            // 간단히 타입만 구분해서 한 건 남긴다 (중복 방지는 on conflict 로직 내부에서)
            serviceNotifier.onChallengeLifecycle(e.challengeId(), e.type(), e.previous(), e.next());
        }

        // FCM은 필요시 pushSender 활용 (토큰 루프는 생략)
    }
}