package com.sandwich.SandWich.project.scheduler;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectViewSyncScheduler {

    private final RedisUtil redisUtil;
    private final StringRedisTemplate redisTemplate;
    private final ProjectRepository projectRepository;

    // 5분마다 실행
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void syncViewCountsToDB() {
        Set<String> keys = redisTemplate.keys("viewcount:project:*");

        if (keys == null || keys.isEmpty()) return;

        for (String key : keys) {
            try {
                Long projectId = extractProjectId(key);
                Long redisCount = redisUtil.getViewCount(key);

                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

                project.setViewCount(redisCount); // or: project.setViewCount(project.getViewCount() + redisCount);
                projectRepository.save(project);  // DB 반영
                redisTemplate.delete(key);        // Redis 키 삭제

                log.info("[view_count 동기화] projectId={} → viewCount={}", projectId, redisCount);
            } catch (Exception e) {
                log.warn("Failed to sync viewCount for key: " + key, e);
            }
        }
    }

    private Long extractProjectId(String redisKey) {
        // "viewcount:project:{id}" → id 파싱
        String[] parts = redisKey.split(":");
        return Long.parseLong(parts[2]);
    }
}
