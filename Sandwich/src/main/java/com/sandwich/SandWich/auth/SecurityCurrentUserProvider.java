package com.sandwich.SandWich.auth;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class SecurityCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;

        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }
        Object principal = auth.getPrincipal();
        if ("anonymousUser".equals(principal)) {
            throw new IllegalStateException("Unauthenticated");
        }

        // 커스텀 principal
        if (principal instanceof UserDetailsImpl u) {
            return u.getId();
        }

        // 혹시 다른 UserDetails 구현으로 들어오는 경우(비권장)
        if (principal instanceof UserDetails u) {
            // u.getUsername() 가 이메일이라면, 필요 시 이메일로 조회해서 ID를 가져오도록 확장 가능
            throw new IllegalStateException("Unsupported principal (UserDetails without id): " + principal.getClass().getSimpleName());
        }

        // (OAuth2DefaultUser 등 다른 타입이 들어오면 여기로 옴)
        throw new IllegalStateException("Unsupported principal type: " + principal.getClass().getName());
    }
}