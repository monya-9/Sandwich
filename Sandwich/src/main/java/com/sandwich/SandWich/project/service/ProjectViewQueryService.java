package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectViewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectViewQueryService {

    private final ProjectViewRepository projectViewRepository;
    private final RedisUtil redisUtil;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public Long getTotalViewCount(Long projectId) {
        long redisCount = redisUtil.getViewCount("viewcount:project:" + projectId);
        long persisted = projectRepository.findById(projectId)
                .map(Project::getViewCount)   // Project.viewCount 필드
                .orElse(0L);
        log.info("[조회수] Redis count = {}", redisCount);
        return persisted + redisCount;
    }
}
