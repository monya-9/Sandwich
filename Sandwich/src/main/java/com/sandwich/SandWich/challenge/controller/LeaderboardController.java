package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.dto.CodeLeaderboardDtos;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.service.PortfolioLeaderboardCache;
import com.sandwich.SandWich.internal.ai.AiJudgeClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/challenges/{id}/leaderboard")
public class LeaderboardController {

    private final ChallengeRepository challengeRepo;
    private final PortfolioLeaderboardCache cache;
    private final AiJudgeClient aiJudgeClient;
    private final JdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> get(@PathVariable Long id,
                                 @RequestParam(defaultValue = "50") int limit) {
        var ch = challengeRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CHALLENGE_NOT_FOUND"));

        limit = Math.max(1, Math.min(limit, 200));

        // 포폴: 기존 캐시 사용
        if (ch.getType() == ChallengeType.PORTFOLIO) {
            return ResponseEntity.ok(cache.get(id, limit));
        }

        // 코드: AI 리더보드 → 우리 포맷
        if (ch.getType() == ChallengeType.CODE) {
            String week = ch.getAiWeek();
            if (week == null || week.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AI_WEEK_REQUIRED");
            }

            var ai = aiJudgeClient.getWeeklyLeaderboard(week);
            if (ai == null || ai.leaderboard() == null || ai.leaderboard().isEmpty()) {
                return ResponseEntity.ok(
                        CodeLeaderboardDtos.Resp.builder()
                                .week(week).items(List.of()).found(false)
                                .generatedAt(System.currentTimeMillis())
                                .build()
                );
            }

            var list  = ai.leaderboard();
            var slice = list.subList(0, Math.min(limit, list.size()));

            // 1) AI user -> Long userId (숫자 문자열만 인정)
            List<Long> ids = slice.stream()
                    .map(e -> parseLongOrNull(e.user()))
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            // 2) id 매칭으로 owner enrich
            Map<Long, CodeLeaderboardDtos.Item.Owner> ownerById = new HashMap<>();
            if (!ids.isEmpty()) {
                String qs = String.join(",", Collections.nCopies(ids.size(), "?"));
                String sql = "SELECT id AS user_id, nickname AS display_name, profile_image_url " +
                        "FROM users WHERE is_deleted = false AND id IN (" + qs + ")";
                var rows = jdbc.query(sql, ids.toArray(), (rs, i) -> Map.of(
                        "userId", rs.getLong("user_id"),
                        "displayName", rs.getString("display_name"),
                        "profile", rs.getString("profile_image_url")
                ));
                for (var r : rows) {
                    Long key = (Long) r.get("userId");
                    ownerById.put(key, CodeLeaderboardDtos.Item.Owner.builder()
                            .userId(key)
                            .username((String) r.get("displayName"))
                            .profileImageUrl((String) r.get("profile"))
                            .build());
                }
            }

            // 3) 응답 조립 (owner는 매칭 성공시에만 세팅)
            var items = new ArrayList<CodeLeaderboardDtos.Item>(slice.size());
            for (var e : slice) {
                Long uid = parseLongOrNull(e.user());
                var owner = (uid == null) ? null : ownerById.get(uid);
                items.add(CodeLeaderboardDtos.Item.builder()
                        .user(e.user())       // AI user 원문(숫자 문자열)
                        .rank(e.rank())
                        .score(e.score())
                        .owner(owner)         // 없으면 null
                        .build());
            }

            var resp = CodeLeaderboardDtos.Resp.builder()
                    .week(ai.week())
                    .items(items)
                    .found(true)
                    .generatedAt(System.currentTimeMillis())
                    .build();
            return ResponseEntity.ok(resp);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_TYPE");
    }

    private static Long parseLongOrNull(String s) {
        if (s == null) return null;
        try { return Long.parseLong(s.trim()); } catch (Exception ignore) { return null; }
    }
}
