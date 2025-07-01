package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.project.domain.Project;
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

        Project saved = projectRepository.save(project);

        // username 기반 preview URL 구성
        String previewUrl = user.getUsername() + ".sandwich.com";

        return new ProjectResponse(saved.getId(), previewUrl);
    }
}
