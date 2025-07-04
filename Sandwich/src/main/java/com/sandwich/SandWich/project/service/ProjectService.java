package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectDetailResponse;
import com.sandwich.SandWich.project.dto.ProjectRequest;
import com.sandwich.SandWich.project.dto.ProjectResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User user) {
        Project project = new Project();
        project.setUser(user);
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setImage(request.getImage());
        project.setTools(request.getTools());
        project.setRepositoryUrl(request.getRepositoryUrl());
        project.setDemoUrl(request.getDemoUrl());
        project.setStartYear(request.getStartYear());
        project.setEndYear(request.getEndYear());
        project.setIsTeam(request.getIsTeam());
        project.setTeamSize(request.getTeamSize());
        project.setCoverUrl(request.getCoverUrl());
        project.setSnsUrl(request.getSnsUrl());
        project.setQrCodeEnabled(request.getQrCodeEnabled());

        Project saved = projectRepository.save(project);

        // username 기반 preview URL 구성
        String previewUrl = user.getUsername() + ".sandwich.com";
        return new ProjectResponse(saved.getId(), previewUrl);
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 프로젝트입니다."));

        return ProjectDetailResponse.builder()
                .projectId(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .image(project.getImage())
                .tools(project.getTools())
                .repositoryUrl(project.getRepositoryUrl())
                .demoUrl(project.getDemoUrl())
                .startYear(project.getStartYear())
                .endYear(project.getEndYear())
                .isTeam(project.getIsTeam())
                .teamSize(project.getTeamSize())
                .coverUrl(project.getCoverUrl())
                .snsUrl(project.getSnsUrl())
                .qrCodeEnabled(project.getQrCodeEnabled())
                .build();
    }
}
