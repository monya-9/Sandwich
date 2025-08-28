package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.global.exception.exceptiontype.JwtInvalidException;
import com.sandwich.SandWich.global.exception.exceptiontype.TokenExpiredException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "this-is-a-very-very-super-secret-key-that-is-at-least-64-characters!";
    private static final long ACCESS_TOKEN_EXP = 1000 * 60 * 15; // 15분
    private static final long REFRESH_TOKEN_EXP = 1000L * 60 * 60 * 24 * 7; // 7일

    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    public String createAccessToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXP))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXP))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String validateToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String createToken(String email, String role) {
        return createAccessToken(email, role);
    }

    public Claims parseClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException(); // 커스텀 예외로 감싸서 던지기
        } catch (JwtException e) {
            throw new JwtInvalidException(); // 다른 모든 JWT 예외 처리
        }
    }
    public String extractUsername(String token) {
        return parseClaims(token).getSubject(); // 이메일이 subject로 들어가 있어야 함
    }

}