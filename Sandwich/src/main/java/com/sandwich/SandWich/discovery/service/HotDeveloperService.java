package com.sandwich.SandWich.discovery.service;

import com.sandwich.SandWich.discovery.dto.HotDeveloperDto;
import com.sandwich.SandWich.discovery.repository.DiscoveryRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
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

    private final @Qualifier("redisJsonTemplate")
    org.springframework.data.redis.core.RedisTemplate<String, Object> redisJsonTemplate;

    @Value("${app.discovery.trend.windowDays:14}")
    private int windowDays;

    @Value("${app.discovery.trend.weights.views:0.5}")
    private double wViews;
    @Value("${app.discovery.trend.weights.likes:2.0}")
    private double wLikes;
    @Value("${app.discovery.trend.weights.comments:3.0}")
    private double wComments;

    @Value("${app.discovery.cacheTtlSeconds:300}")
    private long cacheTtlSeconds;

    public List<HotDeveloperDto> getHot(int limit, int offset) {
        String cacheKey = "hot:developers:v1:list:%d:%d".formatted(limit, offset);
        var cached = redisJsonTemplate.opsForValue().get(cacheKey);
        if (cached instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof HotDeveloperDto) {
            //noinspection unchecked
            return (List<HotDeveloperDto>) cached;
        }

        var rows = discoveryRepository.findHotDevelopers(windowDays, wViews, wLikes, wComments, limit, offset);
        if (rows.isEmpty()) {
            return List.of();
        }

        // 1) 유저/점수 맵
        Map<Long, Double> scoreByUser = rows.stream()
                .collect(Collectors.toMap(DiscoveryRepository.HotDeveloperRow::getUserId, r -> r.getTrendScore() != null ? r.getTrendScore() : 0.0));

        var userIds = scoreByUser.keySet();

        // 2) 유저 카드 정보
        var cards = userRepository.findHotUserCardsByIds(new HashSet<>(userIds))
                .stream().collect(Collectors.toMap(UserRepository.HotUserCard::getId, c -> c));

        // 3) 유저별 top3 프로젝트 썸네일
        var top3 = projectRepository.findTop3CardsByUserIds(new ArrayList<>(userIds));
        Map<Long, List<HotDeveloperDto.ProjectCard>> projectsByUser = new HashMap<>();
        top3.forEach(r -> {
            projectsByUser.computeIfAbsent(r.getUserId(), k -> new ArrayList<>())
                    .add(new HotDeveloperDto.ProjectCard(r.getProjectId(), r.getCoverUrl()));
        });

        // 4) DTO 조립 (원본 순서 보장)
        List<HotDeveloperDto> result = new ArrayList<>(rows.size());
        for (var r : rows) {
            var u = cards.get(r.getUserId());
            String nickname = (u != null) ? u.getNickname() : "탈퇴한 사용자";
            String avatarUrl = (u != null) ? u.getAvatarUrl() : null;
            String position = (u != null) ? u.getPosition() : null;
            var projs = projectsByUser.getOrDefault(r.getUserId(), List.of());
            result.add(new HotDeveloperDto(r.getUserId(), nickname, position, avatarUrl,
                    Optional.ofNullable(r.getTrendScore()).orElse(0.0), projs));
        }

        redisJsonTemplate.opsForValue().set(cacheKey, result, Duration.ofSeconds(cacheTtlSeconds));
        return result;
    }
}
