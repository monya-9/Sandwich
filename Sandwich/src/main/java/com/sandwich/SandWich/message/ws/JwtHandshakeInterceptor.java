package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.global.exception.exceptiontype.JwtInvalidException;
import com.sandwich.SandWich.global.exception.exceptiontype.TokenExpiredException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil; // getUsername()/validate() 등에 맞춰 수정

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String token = extractToken(request);
        if (token == null || token.isBlank()) {
            return false;
        }

        // "Bearer " 접두어 제거
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            // subject = email (네 JwtUtil 설계)
            String email = jwtUtil.extractUsername(token); // ← 여기!
            if (email == null || email.isBlank()) {
                return false;
            }
            attributes.put("username", email); // PrincipalHandshakeHandler에서 사용
            return true;

        } catch (TokenExpiredException | JwtInvalidException e) {
            return false; // 만료/유효하지 않음 → 핸드셰이크 거부
        } catch (Exception e) {
            return false;
        }
    }


    @Override public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                         WebSocketHandler wsHandler, Exception ex) {}

    private String extractToken(ServerHttpRequest request) {
        // 1) ?token=... 또는 2) Authorization: Bearer ...
        URI uri = request.getURI();
        String query = uri.getQuery();
        if (query != null && query.contains("token=")) {
            for (String q : query.split("&")) {
                if (q.startsWith("token=")) return q.substring("token=".length());
            }
        }
        List<String> auth = request.getHeaders().get("Authorization");
        if (auth != null && !auth.isEmpty()) {
            String v = auth.get(0);
            if (v.startsWith("Bearer ")) return v.substring(7);
        }
        return null;
    }
}