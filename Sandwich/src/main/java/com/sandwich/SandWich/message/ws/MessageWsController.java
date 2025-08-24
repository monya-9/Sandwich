package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.service.MessageService;
import com.sandwich.SandWich.message.ws.dto.WsMessageBroadcast;
import com.sandwich.SandWich.message.ws.dto.WsSendMessageRequest;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.OffsetDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class MessageWsController {

    private final MessageService messageService;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate template;

    @MessageMapping("messages.send.{roomId}")
    public void send(@DestinationVariable Long roomId,
                     @Payload WsSendMessageRequest req,
                     Principal principal) {

        String username = principal.getName();
        User me = userRepo.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // WS용 전송 (DB 저장 + room 갱신 + 브로드캐스트)
        Message saved = messageService.sendFromWebSocket(me, roomId, req);

        WsMessageBroadcast out = WsMessageBroadcast.builder()
                .roomId(saved.getRoom().getId())
                .messageId(saved.getId())
                .senderId(saved.getSender().getId())
                .senderNickname(saved.getSender().getNickname())
                .content(saved.getContent())
                .type(saved.getType().name())
                .isRead(false)
                .sentAt(saved.getCreatedAt())
                .build();

        template.convertAndSend("/topic/rooms/" + roomId, out);
    }

    @MessageMapping("messages.read.{roomId}")
    public void read(@DestinationVariable Long roomId, Principal principal) {
        String username = principal.getName();
        User me = userRepo.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        int updated = messageService.markRoomAsRead(me, roomId);

        template.convertAndSend("/topic/rooms/" + roomId, Map.of(
                "event", "READ_ALL",
                "roomId", roomId,
                "readerId", me.getId(),
                "count", updated,
                "readAt", OffsetDateTime.now()
        ));
    }
}