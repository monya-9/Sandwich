package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.domain.ProjectContent;
import com.sandwich.SandWich.project.dto.ProjectContentRequest;
import com.sandwich.SandWich.project.repository.ProjectContentRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.security.access.AccessDeniedException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectContentService {

    private final ProjectRepository projectRepository;
    private final ProjectContentRepository contentRepository;

    @Transactional
    public void saveContents(Long projectId, List<ProjectContentRequest> requestList, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트가 존재하지 않습니다."));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 프로젝트에만 콘텐츠를 등록할 수 있습니다.");
        }

        for (ProjectContentRequest req : requestList) {
            ProjectContent content = new ProjectContent();
            content.setProject(project);
            content.setType(req.getType());
            content.setData(req.getData());
            content.setContentOrder(req.getOrder());

            contentRepository.save(content);
        }
    }
}