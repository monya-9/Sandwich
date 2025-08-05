package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.project.dto.ProjectContentRequest;
import com.sandwich.SandWich.project.dto.ProjectContentUpdateRequest;
import com.sandwich.SandWich.project.dto.ReorderRequest;
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
@RequestMapping("/api/projects/{userId}/{projectId}/contents")
public class ProjectContentController {

    private final ProjectContentService contentService;

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderContents(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @RequestBody List<ReorderRequest> reorderList,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.reorderContents(userId, projectId, reorderList, userDetails.getUser());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Void> saveContents(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @RequestBody List<ProjectContentRequest> requestList,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.saveContents(userId, projectId, requestList, userDetails.getUser());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> deleteContent(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.deleteContent(userId, projectId, contentId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{contentId}")
    public ResponseEntity<Void> updateContent(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @RequestBody ProjectContentUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.updateContent(userId, projectId, contentId, request.getData(), userDetails.getUser());
        return ResponseEntity.ok().build();
    }
}