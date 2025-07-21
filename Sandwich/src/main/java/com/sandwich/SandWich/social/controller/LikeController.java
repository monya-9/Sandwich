package com.sandwich.SandWich.social.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
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
}
