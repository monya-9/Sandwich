package com.sandwich.SandWich.common.util;

import java.security.MessageDigest;

public final class Hashes {
    private Hashes() {}

    /** null-safe SHA-256 hex */
    public static String sha256(String input) {
        try {
            String s = (input == null) ? "" : input;
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(s.getBytes());
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }

    /** X-Forwarded-For 우선으로 클라이언트 IP 추출 (fallback: request.getRemoteAddr()) */
    public static String clientIp(jakarta.servlet.http.HttpServletRequest req) {
        if (req == null) return "";
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // "client, proxy1, proxy2" → 첫 번째가 원본
            int comma = xff.indexOf(',');
            return (comma > 0) ? xff.substring(0, comma).trim() : xff.trim();
        }
        return req.getRemoteAddr();
    }

    /** null-safe UA */
    public static String userAgent(jakarta.servlet.http.HttpServletRequest req) {
        if (req == null) return "";
        String ua = req.getHeader("User-Agent");
        return (ua == null) ? "" : ua;
    }
}
