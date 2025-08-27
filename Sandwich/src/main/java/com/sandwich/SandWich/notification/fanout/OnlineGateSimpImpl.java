package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.user.SimpSubscription;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class OnlineGateSimpImpl implements OnlineGate {

    private final SimpUserRegistry userRegistry;
    private final UserRepository userRepository; // userId -> email 매핑

    @Override
    public boolean isOnline(Long userId) {
        String principalName = resolvePrincipalName(userId);
        if (principalName == null) return false;

        SimpUser user = userRegistry.getUser(principalName);
        boolean online = (user != null) && !user.getSessions().isEmpty();

        // log.debug("[OnlineGate] isOnline userId={} principal={} -> {}", userId, principalName, online);
        return online;
    }

    @Override
    public boolean isSubscribed(Long userId, String dest) {
        String principalName = resolvePrincipalName(userId);
        if (principalName == null) return false;

        SimpUser user = userRegistry.getUser(principalName);
        if (user == null) return false;

        for (var session : user.getSessions()) {
            for (SimpSubscription sub : session.getSubscriptions()) {
                if (Objects.equals(sub.getDestination(), dest)) {
                    // log.debug("[OnlineGate] sub found userId={} dest={}", userId, dest);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Principal 이름이 email이라고 가정 (StompAuthChannelInterceptor에서 acc.getUser().getName() 사용).
     * 만약 Principal이 userId 문자열이라면 아래 주석처럼 바꿔주세요.
     */
    private String resolvePrincipalName(Long userId) {
        return userRepository.findById(userId)
                .map(User::getEmail)
                .orElse(null);

        // Principal이 userId 문자열인 프로젝트라면:
        // return String.valueOf(userId);
    }
}
