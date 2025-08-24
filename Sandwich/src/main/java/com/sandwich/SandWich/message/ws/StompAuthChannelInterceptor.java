package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final MessageRoomRepository roomRepo;
    private static final Pattern ROOM_ID_IN_SEND = Pattern.compile("^/app/messages\\.(send|read)\\.(\\d+)$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        StompCommand cmd = acc.getCommand();
        Principal user = acc.getUser();
        if (user == null) return null;

        if (StompCommand.SEND.equals(cmd)) {
            String dest = acc.getDestination(); // /app/messages.send.{roomId}
            Long roomId = parseRoomId(dest);
            if (roomId == null) return null;

            String username = user.getName();
            // username→userId 조회는 WS Controller에서 수행하므로 여기서는 통과만 할 수도 있음.
            // 필요시 DB조회: roomRepo.isParticipant(roomId, meId) 형태 사용(WS Controller에서 최종검증)
            // preSend에서는 너무 많은 DB I/O를 피하고 최소한만 체크해도 OK.
        }
        return message;
    }

    private Long parseRoomId(String dest) {
        if (dest == null) return null;
        Matcher m = ROOM_ID_IN_SEND.matcher(dest);
        return m.find() ? Long.parseLong(m.group(2)) : null;
    }
}