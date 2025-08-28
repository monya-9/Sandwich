package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.domain.User;
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
    private final UserRepository userRepo;

    private static final Pattern ROOM_ID_IN_SEND = Pattern.compile("^/app/messages\\.(send|read)\\.(\\d+)$");
    private static final Pattern SEND_ALLOWED = Pattern.compile(
            "^/app/(messages\\.(?:send|read)\\.\\d+|typing\\.(?:start|stop)\\.\\d+)$"
    );
    private static final Pattern SUB_ALLOWED  = Pattern.compile(
            "^/topic/(rooms/\\d+|presence/\\d+)$"
    );
    private static final Pattern SUB_USER_NOTI =
            Pattern.compile("^/topic/users/(\\d+)/notifications$");

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
            // 1) 개인 알림 토픽 우선 처리
            Matcher m = SUB_USER_NOTI.matcher(dest == null ? "" : dest);
            if (m.matches()) {
                Long pathUserId = Long.valueOf(m.group(1));
                Long me = resolveCurrentUserId(user.getName());
                if (me == null || !me.equals(pathUserId)) {
                    log.warn("[WS][BLOCK][SUB] other user's notifications: me={} path={}", me, pathUserId);
                    return null; // 본인 아니면 구독 차단
                }
                log.debug("[WS][ALLOW][SUB][NOTI] userId={} dest={}", me, dest);
                return message; // 본인 인증 통과
            }

            // 2) 그 외(rooms/presence) 화이트리스트
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

    private Long resolveCurrentUserId(String principalName) {
        // principalName이 이메일이라는 전제 (스프링 시큐리티 설정에 맞게 필요 시 수정)
        return userRepo.findByEmail(principalName)
                .map(User::getId)
                .orElse(null);
    }
}