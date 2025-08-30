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
        if (principalName == null) {
            log.info("[OnlineGate] isSub? uid={} -> principal=null dest={}", userId, dest);
            return false;
        }

        SimpUser user = userRegistry.getUser(principalName);
        if (user == null) {
            log.info("[OnlineGate] isSub? uid={} principal={} -> user=null dest={}", userId, principalName, dest);
            return false;
        }

        int subs = 0;
        for (var session : user.getSessions()) {
            for (SimpSubscription sub : session.getSubscriptions()) {
                subs++;
                String d = sub.getDestination();
                if (Objects.equals(d, dest)) {
                    log.info("[OnlineGate] isSub? uid={} principal={} FOUND dest={} (session={})",
                            userId, principalName, dest, session.getId());
                    return true;
                }
            }
        }
        log.info("[OnlineGate] isSub? uid={} principal={} dest={} -> false (totalSubs={})",
                userId, principalName, dest, subs);
        return false;
    }

    /**
     * Principal 이름이 email이라고 가정 (StompAuthChannelInterceptor에서 acc.getUser().getName()).
     * 만약 Principal이 userId 문자열이라면 아래 주석처럼 바꿔주세요.
     */
    private String resolvePrincipalName(Long userId) {
        String name = userRepository.findById(userId).map(User::getEmail).orElse(null);
        log.info("[OnlineGate] resolve uid={} -> principal={}", userId, name);
        return name;

        // Principal이 userId 문자열인 프로젝트라면:
        // String name = String.valueOf(userId);
        // log.info("[OnlineGate] resolve uid={} -> principal(userIdStr)={}", userId, name);
        // return name;
    }
}
