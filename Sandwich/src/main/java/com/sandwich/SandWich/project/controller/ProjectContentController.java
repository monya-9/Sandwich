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
@RequestMapping("/api/projects/{username}/{projectId}/contents")
public class ProjectContentController {

    private final ProjectContentService contentService;

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderContents(
            @PathVariable String username,
            @PathVariable Long projectId,
            @RequestBody List<ReorderRequest> reorderList,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.reorderContents(username, projectId, reorderList, userDetails.getUser());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Void> saveContents(
            @PathVariable String username,
            @PathVariable Long projectId,
            @RequestBody List<ProjectContentRequest> requestList,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.saveContents(username, projectId, requestList, userDetails.getUser());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> deleteContent(
            @PathVariable String username,
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.deleteContent(username, projectId, contentId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{contentId}")
    public ResponseEntity<Void> updateContent(
            @PathVariable String username,
            @PathVariable Long projectId,
            @PathVariable Long contentId,
            @RequestBody ProjectContentUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        contentService.updateContent(username, projectId, contentId, request.getData(), userDetails.getUser());
        return ResponseEntity.ok().build();
    }
}