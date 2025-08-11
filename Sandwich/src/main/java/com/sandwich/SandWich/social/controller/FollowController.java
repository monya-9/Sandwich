package com.sandwich.SandWich.social.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.social.dto.FollowCountResponse;
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
    public ResponseEntity<String> follow(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User currentUser = userDetails.getUser();
        followService.follow(currentUser, id);
        return ResponseEntity.ok("팔로우 성공");
    }

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<String> unfollow(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User currentUser = userDetails.getUser();
        followService.unfollow(currentUser, id);
        return ResponseEntity.ok("언팔로우 성공");
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
        List<SimpleUserResponse> response = followService.getFollowingList(id);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/follow-counts")
    public ResponseEntity<FollowCountResponse> getFollowCounts(@PathVariable Long id) {
        FollowCountResponse response = followService.getFollowCounts(id);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{id}/followers")
    public ResponseEntity<List<SimpleUserResponse>> getFollowers(@PathVariable Long id) {
        return ResponseEntity.ok(followService.getFollowerList(id));
    }
}
