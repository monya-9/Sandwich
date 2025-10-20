package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import com.sandwich.SandWich.user.domain.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.AntPathMatcher;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);
    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    // 토큰 검사 '예외'로 둘 공개 경로만 명시 (여기에 /api/auth/devices/** 넣지 말 것!)
    private static final List<String> EXCLUDE_PATHS = List.of(
            "/health",
            "/error", "/error/**",
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/refresh",
            "/api/auth/otp/**",
            "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**",
            "/oauth2/**", "/login/oauth2/**"
    );

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // getRequestURI()가 가장 직관적 (컨텍스트 경로 고려 X)
        String path = request.getRequestURI();
        for (String p : EXCLUDE_PATHS) {
            if (MATCHER.match(p, path)) return true;
        }
        return false; // 위에 없으면 모두 JWT 검사
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null
                && authHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.parseClaims(token);
                String email = claims.getSubject();

                User user = userRepository.findByEmailAndIsDeletedFalse(email)
                        .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다."));

                UserDetailsImpl userDetails = new UserDetailsImpl(user);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                log.warn("JWT 인증 실패: {}", e.getMessage());
                // 실패 시 SecurityContext 비워둠 → 이후 EntryPoint에서 401
            }
        }

        filterChain.doFilter(request, response);
    }
}
