package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.project.dto.ProjectViewDto;
import com.sandwich.SandWich.project.service.ProjectViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class ProjectViewController {

    private final ProjectViewService projectViewService;

    @GetMapping("/{userId}/project-views")
    public ResponseEntity<List<ProjectViewDto>> getUserProjectViews(@PathVariable Long userId) {
        return ResponseEntity.ok(projectViewService.getUserProjectViews(userId));
    }
}