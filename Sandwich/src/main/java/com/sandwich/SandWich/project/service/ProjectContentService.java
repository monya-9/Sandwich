package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.project.domain.ContentType;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.domain.ProjectContent;
import com.sandwich.SandWich.project.dto.ProjectContentRequest;
import com.sandwich.SandWich.project.dto.ReorderRequest;
import com.sandwich.SandWich.project.repository.ProjectContentRepository;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.security.access.AccessDeniedException;
import java.util.List;
import java.util.Comparator;
import java.util.stream.Collectors;
import com.sandwich.SandWich.project.dto.ProjectContentDto;

@Service
@RequiredArgsConstructor
public class ProjectContentService {

    private final ProjectRepository projectRepository;
    private final ProjectContentRepository contentRepository;

    @Transactional(readOnly = true)
    public List<ProjectContentDto> getContents(Long userId, Long projectId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트가 존재하지 않습니다."));
        return project.getContents().stream()
                .sorted(Comparator.comparingInt(ProjectContent::getContentOrder))
                .map(pc -> new ProjectContentDto(pc.getId(), pc.getType(), pc.getData(), pc.getContentOrder()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveContents(Long userId, Long projectId, List<ProjectContentRequest> requestList, User user) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
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

    @Transactional
    public void deleteContent(Long userId, Long projectId, Long contentId, User user) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트가 존재하지 않습니다."));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 프로젝트만 수정/삭제할 수 있습니다.");
        }

        ProjectContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 콘텐츠가 존재하지 않습니다."));

        if (!content.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("해당 콘텐츠는 이 프로젝트에 속해있지 않습니다.");
        }

        contentRepository.delete(content);
    }

    @Transactional
    public void updateContent(Long userId, Long projectId, Long contentId, String newData, User user) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트가 존재하지 않습니다."));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 프로젝트만 수정할 수 있습니다.");
        }

        ProjectContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new IllegalArgumentException("콘텐츠가 존재하지 않습니다."));

        // TEXT 콘텐츠만 수정 허용
        if (!content.getType().equals(ContentType.TEXT)) {
            throw new IllegalArgumentException("TEXT 타입 콘텐츠만 수정할 수 있습니다.");
        }

        content.setData(newData);
    }

    @Transactional
    public void reorderContents(Long userId, Long projectId, List<ReorderRequest> reorderList, User user) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트가 존재하지 않습니다."));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("본인의 프로젝트만 수정 가능합니다.");
        }

        for (ReorderRequest reorder : reorderList) {
            ProjectContent content = contentRepository.findById(reorder.getContentId())
                    .orElseThrow(() -> new IllegalArgumentException("해당 콘텐츠가 존재하지 않습니다."));
            content.setContentOrder(reorder.getOrder());
        }
        // flush를 통한 Dirty Checking으로 저장
    }
}