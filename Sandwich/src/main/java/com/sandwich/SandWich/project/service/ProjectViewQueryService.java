package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.repository.ProjectViewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectViewQueryService {

    private final ProjectViewRepository projectViewRepository;
    private final RedisUtil redisUtil;

    public Long getTotalViewCount(Long projectId) {
        Long dbCount = projectViewRepository.sumViewCountByProjectId(projectId); // ✅ project_views의 SUM
        Long redisCount = redisUtil.getViewCount("viewcount:project:" + projectId); // ✅ redis 값

        log.info("[조회수 합산] DB count = {}, Redis count = {}, Total = {}", dbCount, redisCount, dbCount + redisCount);

        return dbCount + (redisCount != null ? redisCount : 0L);
    }
}
