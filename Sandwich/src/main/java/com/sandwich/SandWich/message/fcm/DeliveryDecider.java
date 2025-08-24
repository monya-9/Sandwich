package com.sandwich.SandWich.message.fcm;

import com.sandwich.SandWich.message.ws.SubscriptionRegistry;
import com.sandwich.SandWich.message.ws.WsEventListener;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;



@Component
@RequiredArgsConstructor
public class DeliveryDecider {
    private final WsEventListener presence;          // isOnline(userId) 제공
    private final SubscriptionRegistry subRegistry;  // isSubscribed(email, prefix) 제공
    private final UserRepository userRepo;

    public boolean shouldSendPushForMessage(Long targetUserId, Long roomId) {
        // 1) 온라인 아니면 → 푸시
        if (!presence.isOnline(targetUserId)) return true;

        // 2) 온라인이면, 그 방을 실제 보고 있는지 체크
        String email = userRepo.findById(targetUserId).map(User::getEmail).orElse(null);
        boolean watching = subRegistry.isSubscribed(email, "/topic/rooms/" + roomId);

        // 방을 보고 있지 않다면 → 푸시, 보고 있으면 → 생략
        return !watching;
    }
}