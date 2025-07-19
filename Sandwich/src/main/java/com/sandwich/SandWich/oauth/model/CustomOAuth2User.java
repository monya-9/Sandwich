package com.sandwich.SandWich.oauth.model;


import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
@AllArgsConstructor
public class CustomOAuth2User implements OAuth2User {

    private final String provider;
    private final OAuth2User delegate;

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    public String getEmail() {
        return delegate.getAttribute("email");
    }

    public String getUsername() {
        return delegate.getAttribute("login");
    }
}