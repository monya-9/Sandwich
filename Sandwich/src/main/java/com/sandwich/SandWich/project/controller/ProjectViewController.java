package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.project.dto.ProjectViewDto;
import com.sandwich.SandWich.project.service.ProjectViewService;
import com.sandwich.SandWich.user.domain.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class ProjectViewController {

    private final ProjectViewService projectViewService;

    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'AI')")
    @GetMapping("/{userId}/project-views")
    public ResponseEntity<List<ProjectViewDto>> getUserProjectViews(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long currentUserId = userDetails.getUser().getId();
        Role role = userDetails.getUser().getRole();

        // 일반 사용자는 자기 자신만 조회 가능
        if (role == Role.ROLE_USER && !userId.equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // ADMIN, AI는 누구든 접근 가능
        List<ProjectViewDto> views = projectViewService.getUserProjectViews(userId);
        return ResponseEntity.ok(views);
    }
}