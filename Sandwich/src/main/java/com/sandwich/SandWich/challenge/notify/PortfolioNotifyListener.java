package com.sandwich.SandWich.challenge.notify;

import com.sandwich.SandWich.challenge.event.SubmissionCreatedEvent;
import com.sandwich.SandWich.notification.dto.NotifyPayload;
import com.sandwich.SandWich.notification.fanout.PushSender;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PortfolioNotifyListener {

    private final SimpMessagingTemplate ws;              // WS 브로드캐스트용
    private final PushSender pushSender;                 // FCM data-only (조건부 빈)

    @Value("${ops.system-notify.enabled:true}")
    private boolean systemNotifyEnabled;

    @Value("${app.system.user-id}")
    private Long systemUserId;

    // 트랜잭션 커밋 후 발행(실제 저장이 끝난 다음에 보냄)
    @TransactionalEventListener
    public void onSubmissionCreated(SubmissionCreatedEvent e) {
        if (!systemNotifyEnabled || systemUserId == null) return;

        // 1) 공통 페이로드
        NotifyPayload payload = NotifyPayload.builder()
                .event("SUBMISSION_RECEIVED")
                .actorId(e.ownerId())
                .targetUserId(systemUserId)
                .resource(new NotifyPayload.Resource("SUBMISSION", e.submissionId()))
                .deepLink("/challenges/" + e.challengeId() + "/submissions/" + e.submissionId())
                .title("새 제출물 도착")
                .body(e.title() != null ? e.title() : "제출물이 접수되었습니다")
                .extra(Map.of(
                        "challengeId", e.challengeId(),
                        "submissionId", e.submissionId(),
                        "repoUrl", e.repoUrl(),
                        "demoUrl", e.demoUrl()
                ))
                .createdAt(OffsetDateTime.now())
                .build();

        // 2) WebSocket: 개인 알림 채널로 전달
        // 구독 경로: /topic/users/{userId}/notifications  (네 테스트 페이지와 맞춤)
        ws.convertAndSend("/topic/users/" + systemUserId + "/notifications", payload);

        // 3) (선택) FCM: 시스템 계정이 웹 푸시 등록돼 있다면 data-only 전송
        // PushSender 구현(FcmPushSender)은 data map의 "_token"이 필요하므로
        // 보통 별도의 PushTokenService로 사용자 토큰을 찾아서 루프 전송한다.
        try {
            // 예시) 토큰 한 개만 알고 있는 경우
            String token = null; // <- pushTokenService.findOneByUserId(systemUserId)
            if (token != null && !token.isBlank()) {
                Map<String, String> data = new LinkedHashMap<>();
                data.put("_token", token);                 // 필수
                data.put("title", payload.getTitle());
                data.put("body", payload.getBody());
                data.put("deepLink", payload.getDeepLink());
                data.put("event", payload.getEvent());
                data.put("challengeId", e.challengeId().toString());
                data.put("submissionId", e.submissionId().toString());
                pushSender.sendData(systemUserId, data);
            }
        } catch (Exception ignore) {
            // 푸시 토큰이 없으면 WS만 나가도 OK
        }
    }
}