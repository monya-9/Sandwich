package com.sandwich.SandWich.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ServiceTokenFilter extends OncePerRequestFilter {

    private final Set<String> apiKeySet;

    public ServiceTokenFilter(@Value("${INTERNAL_API_KEYS:}") String keysCsv) {
        this.apiKeySet = Arrays.stream(keysCsv.split(","))
                .map(String::trim).filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String p = req.getRequestURI();
        return !p.startsWith("/internal/ai/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String apiKey = req.getHeader("X-AI-API-Key");
        if (apiKey != null && apiKeySet.contains(apiKey)) {
            var auth = new UsernamePasswordAuthenticationToken(
                    "svc:ai", "N/A",
                    List.of(new SimpleGrantedAuthority("SCOPE_CHALLENGE_BATCH_WRITE"),
                            new SimpleGrantedAuthority("ROLE_SERVICE"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(req, res);
    }
}
