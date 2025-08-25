package com.sandwich.SandWich.message.ws;

import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.global.exception.exceptiontype.JwtInvalidException;
import com.sandwich.SandWich.global.exception.exceptiontype.TokenExpiredException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String token = extractToken(request);
        if (token == null || token.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            System.out.println("[WS][AUTH] missing token");
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
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                System.out.println("[WS][AUTH] empty email in token");
                return false;
            }
            attributes.put("username", email); // PrincipalHandshakeHandler에서 사용
            System.out.println("[WS][AUTH] ok user=" + email);
            return true;

        } catch (TokenExpiredException e) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            System.out.println("[WS][AUTH] token expired");
            return false;

        } catch (JwtInvalidException e) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            System.out.println("[WS][AUTH] token invalid");
            return false;

        } catch (Exception e) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            System.out.println("[WS][AUTH] unexpected: " + e.getMessage());
            return false;
        }
    }


    @Override public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                         WebSocketHandler wsHandler, Exception ex) {}

    private String extractToken(ServerHttpRequest request) {
        // 1) ?token=... 또는 2) Authorization: Bearer ...
        URI uri = request.getURI();
        String q = uri.getQuery();
        if (q != null && q.contains("token=")) {
            for (String s : q.split("&")) if (s.startsWith("token=")) return s.substring(6);
        }
        List<String> auth = request.getHeaders().get("Authorization");
        return (auth != null && !auth.isEmpty()) ? auth.get(0) : null;
    }
}