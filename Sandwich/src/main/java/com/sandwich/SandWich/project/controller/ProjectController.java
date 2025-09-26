package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.dto.ProjectDetailResponse;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;
import com.sandwich.SandWich.project.dto.ProjectRequest;
import com.sandwich.SandWich.project.dto.ProjectResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.project.repository.ProjectViewRepository;
import com.sandwich.SandWich.project.service.ProjectService;
import com.sandwich.SandWich.project.service.ProjectViewQueryService;
import com.sandwich.SandWich.project.service.ProjectViewService;
import com.sandwich.SandWich.project.support.UploadWindow;
import com.sandwich.SandWich.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectViewService projectViewService;
    private final ProjectViewQueryService projectViewQueryService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        User user = userDetails.getUser();
        ProjectResponse response = projectService.createProject(request, user);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/{id}")
    public ResponseEntity<Void> updateProject(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        projectService.updateProject(userId, id, request, userDetails.getUser());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long userId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        projectService.deleteProject(userId, id, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/{id}")
    public ResponseEntity<ProjectDetailResponse> getProject(
            @PathVariable Long userId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            HttpServletRequest request
    ) {
        User user = userDetails != null ? userDetails.getUser() : null;

        // 조회수 처리 (view_count 증가 + project_views 기록)
        projectViewService.handleProjectView(id, user, request);

        // 기존 상세 조회 로직
        ProjectDetailResponse response = projectService.getProjectByUserIdAndProjectId(userId, id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public PageResponse<ProjectListItemResponse>
            list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UploadWindow uploadedWithin,
            @RequestParam(defaultValue = "false") boolean followingOnly,
            @RequestParam(required = false) Long authorId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Pageable pageable = PageRequest.of(page, size);

        if (authorId != null) {
            return projectService.findProjectsByAuthor(authorId, pageable);
        }

        Long currentUserId = null;
        if (followingOnly) {
            if (userDetails == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "Login required for followingOnly=true"
                );
            }
            currentUserId = userDetails.getId();
        } else if (userDetails != null) {
            currentUserId = userDetails.getId(); // 사용 안 해도 무방
        }

        return projectService.findAllProjects(q, uploadedWithin, followingOnly, currentUserId, pageable);
    }

    @GetMapping("/user/{userId}")
    public PageResponse<ProjectListItemResponse> listByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return projectService.findProjectsByAuthor(userId, pageable);
    }

    @GetMapping("/{id}/views")
    public ResponseEntity<Long> getTotalViewCount(@PathVariable Long id) {
        Long total = projectViewQueryService.getTotalViewCount(id);
        return ResponseEntity.ok(total);
    }
}
