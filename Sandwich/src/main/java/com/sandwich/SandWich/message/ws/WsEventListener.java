package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.GenericMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

import java.security.Principal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WsEventListener {

    private final UserRepository userRepo;
    private final SubscriptionRegistry subRegistry;

    // 간단한 온라인 상태: userId -> 활성 세션 수
    private final Map<Long, Integer> onlineCount = new ConcurrentHashMap<>();

    private Long emailToUserId(String email) {
        if (email == null) return null;
        return userRepo.findByEmail(email).map(User::getId).orElse(null);
    }

    /** Principal 우선, 없으면 세션 속성에서 "username"을 꺼내는 헬퍼 */
    private String resolveEmail(Message<?> message, Principal principal) {
        if (principal != null && principal.getName() != null) return principal.getName();
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        Object fromAttr = (acc.getSessionAttributes() != null)
                ? acc.getSessionAttributes().get("username")
                : null;
        return fromAttr != null ? fromAttr.toString() : null;
    }

    @EventListener
    public void onConnect(SessionConnectEvent e) {
        Principal p = e.getUser();
        String email = (p != null) ? p.getName() : null;
        Long userId = emailToUserId(email);
        System.out.println("[WS][CONNECT] user=" + email + " userId=" + userId);
        if (userId != null) onlineCount.merge(userId, 1, Integer::sum);
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent e) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(e.getMessage());
        String dest = acc.getDestination();
        String email = (e.getUser() != null) ? e.getUser().getName() : null;
        System.out.println("[WS][SUB] user=" + email + " dest=" + dest);
        if (dest != null) subRegistry.add(email, dest);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent e) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(e.getMessage());
        String dest = acc.getDestination();
        String email = (e.getUser() != null) ? e.getUser().getName() : null;
        System.out.println("[WS][UNSUB] user=" + email + " dest=" + dest);
        if (dest != null) subRegistry.remove(email, dest);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent e) {
        String email = resolveEmail(e.getMessage(), e.getUser()); // ★ 핵심: 세션 속성 fallback
        Long userId = emailToUserId(email);
        System.out.println("[WS][DISCONNECT] user=" + email + " status=" + e.getCloseStatus());
        if (userId != null) {
            onlineCount.computeIfPresent(userId, (k, v) -> Math.max(0, v - 1));
        }
        // 세션 종료 시 구독 일괄 정리 + 로그
        if (email != null) {
            subRegistry.clearFor(email); // 아래에 메서드 추가했죠
        }
    }

    // 서비스에서 현재 온라인 여부를 알고 싶을 때 사용
    public boolean isOnline(Long userId) {
        return onlineCount.getOrDefault(userId, 0) > 0;
    }
}