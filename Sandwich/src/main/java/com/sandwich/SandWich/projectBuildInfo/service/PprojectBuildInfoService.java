package com.sandwich.SandWich.projectBuildInfo.service;

import com.sandwich.SandWich.projectBuildInfo.domain.ProjectBuildInfo;
import com.sandwich.SandWich.projectBuildInfo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PprojectBuildInfoService {

    private final ProjectBuildInfoRepository repository;

    public ProjectBuildInfo saveOrUpdateBuildInfo(Long userId, Long projectId, String gitUrl) {
        ProjectBuildInfo info = repository.findByProjectId(projectId)
                .orElse(ProjectBuildInfo.builder()
                        .userId(userId)
                        .projectId(projectId)
                        .build());

        info.setGitUrl(gitUrl);
        return repository.save(info);
    }

    public Optional<ProjectBuildInfo> getBuildInfo(Long projectId) {
        return repository.findByProjectId(projectId);
    }
}
