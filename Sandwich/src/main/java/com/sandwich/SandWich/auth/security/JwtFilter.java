package com.sandwich.SandWich.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ") &&
                SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authHeader.substring(7);
            try {
                // JWT에서 직접 정보 파싱
                Claims claims = jwtUtil.parseClaims(token); // → 아래에서 만들 예정
                String username = claims.getSubject();
                String role = claims.get("role", String.class);
                System.out.println(">> JWT role 값: " + role);

                log.info("JWT 필터 통과 - username: {}, role: {}", username, role);

                // 권한 직접 부여
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.replace("ROLE_", "")));
                var userDetails = new org.springframework.security.core.userdetails.User(username, "", authorities);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                log.info("최종 인증 객체: {}", auth);
                log.info(">> 권한들: {}", auth.getAuthorities());

                System.out.println(">> 현재 인증 객체: " + auth);
                System.out.println(">> 권한들: " + auth.getAuthorities());
            }catch (ExpiredJwtException e) {
                log.warn("Access Token 만료: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\": \"Access Token이 만료되었습니다.\"}");
                return;
            } catch (Exception e) {
                log.warn("JWT 필터 실패: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("필터 종료 전 Authentication: {}", auth);
        filterChain.doFilter(request, response);
    }
}
