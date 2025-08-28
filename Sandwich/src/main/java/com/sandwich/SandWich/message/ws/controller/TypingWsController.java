package com.sandwich.SandWich.message.ws.controller;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TypingWsController {

    private final MessageRoomRepository roomRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate template;

    @MessageMapping("typing.start.{roomId}")
    public void start(@DestinationVariable Long roomId, Principal principal) {
        publish(roomId, principal, true);
    }

    @MessageMapping("typing.stop.{roomId}")
    public void stop(@DestinationVariable Long roomId, Principal principal) {
        publish(roomId, principal, false);
    }

    private void publish(Long roomId, Principal principal, boolean typing) {
        String email = principal.getName();
        var me = userRepo.findByEmail(email).orElseThrow();

        // 디버그 로그로 호출 여부/권한 여부부터 확인
        log.info("[TYPING] {} userId={} roomId={}", typing ? "START" : "STOP", me.getId(), roomId);

        if (!roomRepo.isParticipant(roomId, me.getId())) {
            log.warn("[TYPING] ignored (not a participant) userId={} roomId={}", me.getId(), roomId);
            return;
        }

        var payload = Map.of(
                "event", typing ? "TYPING_START" : "TYPING_STOP",
                "roomId", roomId,
                "userId", me.getId(),
                "at", OffsetDateTime.now().toString()
        );
        template.convertAndSend("/topic/rooms/" + roomId, payload);
        log.info("[TYPING] broadcast -> /topic/rooms/{} {}", roomId, payload);
    }
}