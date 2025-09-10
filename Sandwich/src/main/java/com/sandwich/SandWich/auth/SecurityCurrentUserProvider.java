package com.sandwich.SandWich.auth;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SecurityCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;

        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        Object principal = auth.getPrincipal();
        if ("anonymousUser".equals(principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }

        // 커스텀 principal
        if (principal instanceof UserDetailsImpl u) {
            return u.getId();
        }

        // 다른 UserDetails 구현이 들어온 경우(비권장) → 401
        if (principal instanceof UserDetails) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Unsupported principal (UserDetails without id)"
            );
        }

        // 그 외 타입 → 401
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Unsupported principal type: " + principal.getClass().getName()
        );
    }
}