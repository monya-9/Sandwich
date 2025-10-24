package com.sandwich.SandWich.discovery.service;

import com.sandwich.SandWich.discovery.dto.HotDeveloperDto;
import com.sandwich.SandWich.discovery.repository.DiscoveryRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HotDeveloperService {

    private final DiscoveryRepository discoveryRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    // 🔹 @Cacheable로 결과 캐싱 (키: "limit:offset")
    @org.springframework.cache.annotation.Cacheable(
            cacheNames = "hotDevelopers",
            key = "T(java.lang.String).format('%d:%d', #limit, #offset)"
    )
    public List<HotDeveloperDto> getHot(int limit, int offset) {
        // ↓↓↓ 기존 로직 유지 (DB 조회 → DTO 조립)
        var rows = discoveryRepository.findHotDevelopers(windowDays, wViews, wLikes, wComments, limit, offset);
        if (rows.isEmpty()) return List.of();

        Map<Long, Double> scoreByUser = rows.stream()
                .collect(Collectors.toMap(
                        DiscoveryRepository.HotDeveloperRow::getUserId,
                        r -> r.getTrendScore() != null ? r.getTrendScore() : 0.0
                ));

        var userIds = scoreByUser.keySet();

        var cards = userRepository.findHotUserCardsByIds(new HashSet<>(userIds))
                .stream().collect(Collectors.toMap(UserRepository.HotUserCard::getId, c -> c));

        var top3 = projectRepository.findTop3CardsByUserIds(new ArrayList<>(userIds));
        Map<Long, List<HotDeveloperDto.ProjectCard>> projectsByUser = new HashMap<>();
        top3.forEach(r -> {
            projectsByUser.computeIfAbsent(r.getUserId(), k -> new ArrayList<>())
                    .add(new HotDeveloperDto.ProjectCard(r.getProjectId(), r.getCoverUrl()));
        });

        List<HotDeveloperDto> result = new ArrayList<>(rows.size());
        for (var r : rows) {
            var u = cards.get(r.getUserId());
            String nickname = (u != null) ? u.getNickname() : "탈퇴한 사용자";
            String avatarUrl = (u != null) ? u.getAvatarUrl() : null;
            String position  = (u != null) ? u.getPosition()  : null;
            var projs = projectsByUser.getOrDefault(r.getUserId(), List.of());
            result.add(new HotDeveloperDto(
                    r.getUserId(), nickname, position, avatarUrl,
                    Optional.ofNullable(r.getTrendScore()).orElse(0.0), projs));
        }
        return result;
    }

    // 🔹 캐시 전부 무효화 (관리자용)
    @org.springframework.cache.annotation.CacheEvict(cacheNames = "hotDevelopers", allEntries = true)
    public void evictAll() {
        // no-op (어노테이션이 캐시 삭제 수행)
    }

    // ---- 기존 필드들 중 수동 Redis 캐시 관련은 제거 ----
    @Value("${app.discovery.trend.windowDays:14}") private int windowDays;
    @Value("${app.discovery.trend.weights.views:0.5}")    private double wViews;
    @Value("${app.discovery.trend.weights.likes:2.0}")    private double wLikes;
    @Value("${app.discovery.trend.weights.comments:3.0}") private double wComments;
}

