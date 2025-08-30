package com.sandwich.SandWich.social.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.social.dto.FollowCountResponse;
import com.sandwich.SandWich.social.dto.FollowStatusResponse;
import com.sandwich.SandWich.social.service.FollowService;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.dto.SimpleUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{id}/follow")
    public ResponseEntity<FollowStatusResponse> follow(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User currentUser = userDetails.getUser();
        return ResponseEntity.ok(followService.follow(currentUser, id));
    }

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<FollowStatusResponse> unfollow(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User currentUser = userDetails.getUser();
        return ResponseEntity.ok(followService.unfollow(currentUser, id));
    }

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<Map<String, Boolean>> isFollowing(@PathVariable Long id,
                                                            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User currentUser = userDetails.getUser();
        boolean isFollowing = followService.isFollowing(currentUser, id);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<SimpleUserResponse>> getFollowingList(@PathVariable Long id) {
        return ResponseEntity.ok(followService.getFollowingList(id));
    }

    @GetMapping("/{id}/follow-counts")
    public ResponseEntity<FollowCountResponse> getFollowCounts(@PathVariable Long id) {
        return ResponseEntity.ok(followService.getFollowCounts(id));
    }
    @GetMapping("/{id}/followers")
    public ResponseEntity<List<SimpleUserResponse>> getFollowers(@PathVariable Long id) {
        return ResponseEntity.ok(followService.getFollowerList(id));
    }
}
