package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final MessageRoomRepository roomRepo;
    private static final Pattern ROOM_ID_IN_SEND = Pattern.compile("^/app/messages\\.(send|read)\\.(\\d+)$");
    private static final Pattern SEND_ALLOWED = Pattern.compile(
            "^/app/(messages\\.(?:send|read)\\.\\d+|typing\\.(?:start|stop)\\.\\d+)$"
    );
    private static final Pattern SUB_ALLOWED  = Pattern.compile(
            "^/topic/(rooms/\\d+|presence/\\d+)$"
    );

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        StompCommand cmd = acc.getCommand();
        if (cmd == null) return message;

        Principal user = acc.getUser();
        if (user == null) {
            log.debug("[WS][BLOCK] no principal for cmd={} dest={}", cmd, acc.getDestination());
            return null;
        }

        String dest = acc.getDestination();

        if (cmd == StompCommand.SEND) {
            if (dest == null || !SEND_ALLOWED.matcher(dest).matches()) {
                log.debug("[WS][BLOCK][SEND] dest={}", dest);
                return null;
            }
            // (선택) roomId 권한 체크를 여기서 하려면 dest에서 숫자 뽑아 roomRepo.isParticipant(...) 검사
            return message;
        }

        if (cmd == StompCommand.SUBSCRIBE) {
            if (dest == null || !SUB_ALLOWED.matcher(dest).matches()) {
                log.debug("[WS][BLOCK][SUB] dest={}", dest);
                return null;
            }
            return message;
        }
        return message;
    }

    private Long parseRoomId(String dest) {
        if (dest == null) return null;
        Matcher m = ROOM_ID_IN_SEND.matcher(dest);
        return m.find() ? Long.parseLong(m.group(2)) : null;
    }
}