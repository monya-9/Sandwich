package com.sandwich.SandWich.social.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.social.dto.LikedUserResponse;
import org.springframework.lang.Nullable;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.social.dto.LikeRequest;
import com.sandwich.SandWich.social.dto.LikeResponse;
import com.sandwich.SandWich.social.service.LikeService;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<LikeResponse> toggleLike(
            @RequestBody LikeRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userDetails.getUser(); // 이렇게 꺼냄
        LikeResponse response = likeService.toggleLike(user, request.getTargetType(), request.getTargetId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<LikeResponse> getLikeStatus(
            @RequestParam LikeTargetType targetType,
            @RequestParam Long targetId,
            @AuthenticationPrincipal @Nullable UserDetailsImpl userDetails
    ) {
        User user = (userDetails != null) ? userDetails.getUser() : null;
        LikeResponse response = likeService.getLikeStatus(user, targetType, targetId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<org.springframework.data.domain.Page<LikedUserResponse>> getLikedUsers(
            @RequestParam LikeTargetType targetType,
            @RequestParam Long targetId,
            Pageable pageable
    ) {
        org.springframework.data.domain.Page<LikedUserResponse> response = likeService.getLikedUsers(targetType, targetId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/projects")
    public ResponseEntity<PageResponse<ProjectListItemResponse>> getMyLikedProjects(Pageable pageable,
                                                                                   @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PageResponse<ProjectListItemResponse> page = likeService.getLikedProjectsByUserId(userDetails.getId(), pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/users/{userId}/projects")
    public ResponseEntity<PageResponse<ProjectListItemResponse>> getUserLikedProjects(@PathVariable Long userId,
                                                                                      Pageable pageable) {
        PageResponse<ProjectListItemResponse> page = likeService.getLikedProjectsByUserId(userId, pageable);
        return ResponseEntity.ok(page);
    }
}
