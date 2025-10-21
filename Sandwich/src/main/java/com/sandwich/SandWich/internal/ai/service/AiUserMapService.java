package com.sandwich.SandWich.internal.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiUserMapService {

    private final JdbcTemplate jdbc;

    private static String normalize(String s) {
        if (s == null) return null;
        // Unicode NFC → lower → trim → 공백제거 (환경에 맞게 규칙 고정)
        String n = Normalizer.normalize(s, Normalizer.Form.NFC).toLowerCase().trim();
        return n.replaceAll("\\s+", "");
    }

    /** 배치 조회: leaderboard user → user_id 매핑 (우선 매핑테이블, 보조로 users.username 일치 시도) */
    public Map<String, Long> mapUsers(String aiSource, List<String> aiUsernames) {
        Map<String, Long> out = new HashMap<>();
        if (aiUsernames == null || aiUsernames.isEmpty()) return out;

        // 1) 매핑 테이블 조회
        var norms = aiUsernames.stream().map(AiUserMapService::normalize).distinct().toList();
        var rows = jdbc.query("""
            SELECT ai_username, user_id
            FROM ai_user_map
            WHERE ai_source = ? AND normalized = ANY (?)
        """, ps -> {
            ps.setString(1, aiSource);
            ps.setArray(2, ps.getConnection().createArrayOf("text", norms.toArray()));
        }, (rs, i) -> Map.of(
                "ai_username", rs.getString("ai_username"),
                "user_id", rs.getLong("user_id")
        ));

        // 역정규화 매칭: normalized가 동일하면 ok
        // (테이블에 raw ai_username 저장되어 있으니 그대로 키로 써도 되고 normalize(aiUsername)로 키 매칭해도 됨)
        var normToUserId = new HashMap<String, Long>();
        for (var r : rows) {
            var norm = normalize((String) r.get("ai_username"));
            normToUserId.put(norm, (Long) r.get("user_id"));
        }
        for (var name : aiUsernames) {
            var n = normalize(name);
            if (normToUserId.containsKey(n)) out.put(name, normToUserId.get(n));
        }

        // 2) 매핑 안 된 건 users.username 보조 매칭(정확 일치만, 위험하면 끄기)
        var remain = aiUsernames.stream().filter(u -> !out.containsKey(u)).distinct().toList();
        if (!remain.isEmpty()) {
            var rows2 = jdbc.query("""
                SELECT username, id AS user_id
                FROM users
                WHERE is_deleted = false AND username = ANY (?)
            """, ps -> ps.setArray(1, ps.getConnection().createArrayOf("text", remain.toArray())),
                    (rs, i) -> Map.of("username", rs.getString("username"), "user_id", rs.getLong("user_id")));
            for (var r : rows2) {
                out.put((String) r.get("username"), (Long) r.get("user_id"));
            }
        }
        return out;
    }
}
