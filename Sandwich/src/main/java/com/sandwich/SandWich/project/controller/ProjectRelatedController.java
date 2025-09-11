package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.project.dto.ProjectCarouselItemResponse;
import com.sandwich.SandWich.project.service.ProjectRelatedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects")
public class ProjectRelatedController {

    private final ProjectRelatedService projectRelatedService;

    @GetMapping("/{projectId}/author/others")
    public PageResponse<ProjectCarouselItemResponse> getAuthorOthers(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "12") int size
    ) {
        return projectRelatedService.getAuthorOthers(projectId, size);
    }
}