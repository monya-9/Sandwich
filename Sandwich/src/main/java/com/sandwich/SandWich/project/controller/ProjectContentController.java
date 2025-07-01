package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.project.dto.ProjectContentRequest;
import com.sandwich.SandWich.project.dto.ProjectContentUpdateRequest;
import com.sandwich.SandWich.project.service.ProjectContentService;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{projectId}/contents")
public class ProjectContentController {

    private final ProjectContentService contentService;

    @PostMapping
    public ResponseEntity<Void> saveContents(
            @PathVariable Long projectId,
            @RequestBody List<ProjectContentRequest> requestList,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        User user = userDetails.getUser();
        contentService.saveContents(projectId, requestList, user);
        return ResponseEntity.ok().build();
    }


    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> deleteContent(
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        User user = userDetails.getUser();
        contentService.deleteContent(projectId, contentId, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{contentId}")
    public ResponseEntity<Void> updateContent(
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @RequestBody ProjectContentUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.updateContent(projectId, contentId, request.getData(), userDetails.getUser());
        return ResponseEntity.ok().build();
    }
}