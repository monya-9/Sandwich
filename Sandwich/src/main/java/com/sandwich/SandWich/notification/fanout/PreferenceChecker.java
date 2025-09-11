package com.sandwich.SandWich.notification.fanout;

import com.sandwich.SandWich.notification.domain.NotificationPreference;
import com.sandwich.SandWich.notification.repository.NotificationPreferenceRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PreferenceChecker {

    private final NotificationPreferenceRepository repo;
    private final UserRepository userRepo;

    // WS는 항상 true
    public boolean isAllowed(Long userId, NotifyKind kind, NotifyChannel channel) {
        if (channel == NotifyChannel.WS) return true;

        var pref = repo.findByUserId(userId)
                .orElse(null);
        if (pref == null) {
            // 레코드 없으면 Defaults(서비스 정책)로 판단
            pref = defaultSnapshot();
        }
        return switch (channel) {
            case PUSH  -> checkPush(pref, kind);
            case EMAIL -> checkEmail(pref, kind);
            case WS    -> true;
        };
    }

    private boolean checkPush(NotificationPreference p, NotifyKind k) {
        return switch (k) {
            case MESSAGE     -> p.isPushMessage();
            case COMMENT     -> p.isPushComment();
            case LIKE        -> p.isPushLike();
            case FOLLOW      -> p.isPushFollow();
            case COLLECTION  -> p.isPushCollection();
            case EVENT       -> p.isPushEvent();
            case WORK_DIGEST -> p.isPushWorkDigest();
        };
    }

    private boolean checkEmail(NotificationPreference p, NotifyKind k) {
        return switch (k) {
            case MESSAGE     -> p.isEmailMessage();
            case COMMENT     -> p.isEmailComment();
            case LIKE        -> p.isEmailLike();
            case FOLLOW      -> p.isEmailFollow();
            case COLLECTION  -> p.isPushCollection();
            case EVENT       -> p.isEmailEvent();
            case WORK_DIGEST -> p.isEmailWorkDigest();
        };
    }

    // 서비스 정책 기본값 스냅샷
    private NotificationPreference defaultSnapshot() {
        return NotificationPreference.builder()
                .pushMessage(true).pushComment(true).pushLike(false)
                .pushFollow(true).pushEvent(false).pushWorkDigest(false)
                .pushCollection(false)
                .emailMessage(false).emailComment(false).emailLike(false)
                .emailFollow(false).emailEvent(false).emailWorkDigest(false)
                .build();
    }
}