package com.sandwich.SandWich.project.scheduler;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectViewSyncScheduler {

    private final RedisUtil redisUtil;
    private final StringRedisTemplate redisTemplate;
    private final ProjectRepository projectRepository;

    // 5분마다 실행
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void syncViewCountsToDB() {
        String pattern = "viewcount:project:*";
        ScanOptions options = ScanOptions.scanOptions().match(pattern).count(100).build();

        log.info("[ViewSyncScheduler] Start Redis → DB sync");

        redisTemplate.execute((RedisCallback<Void>) connection -> {
            try (Cursor<byte[]> cursor = connection.scan(options)) {
                while (cursor.hasNext()) {
                    String key = new String(cursor.next(), StandardCharsets.UTF_8);
                    try {
                        syncSingleProject(key);
                    } catch (Exception e) {
                        log.warn("Failed to sync viewCount for key={}", key, e);
                    }
                }
            } catch (Exception e) {
                log.error("Redis SCAN operation failed", e);
            }
            return null;
        });

        log.info("[ViewSyncScheduler] End Redis → DB sync");
    }

    @Transactional
    protected void syncSingleProject(String key) {
        Long projectId = extractProjectId(key);
        Long redisCount = redisUtil.getViewCount(key);

        projectRepository.findById(projectId).ifPresentOrElse(project -> {
            project.setViewCount(redisCount);
            projectRepository.save(project);
            redisTemplate.delete(key);
            log.info("[view_count synced] projectId={} → viewCount={} (key={})", projectId, redisCount, key);
        }, () -> {
            log.warn("Project not found for key: {}. Deleting stale Redis key.", key);
            redisTemplate.delete(key);
        });
    }

    private Long extractProjectId(String redisKey) {
        String[] parts = redisKey.split(":");
        if (parts.length < 3) throw new IllegalArgumentException("Invalid Redis key format: " + redisKey);
        return Long.parseLong(parts[2]);
    }
}
