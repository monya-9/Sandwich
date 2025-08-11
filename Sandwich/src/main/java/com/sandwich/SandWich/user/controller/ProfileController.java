package com.sandwich.SandWich.user.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;
    @GetMapping("/me/collection-count")
    public ResponseEntity<Map<String, Long>> getMySavedCount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        long count = profileService.getSavedCollectionCount(userDetails.getUser());
        return ResponseEntity.ok(Map.of("savedCount", count));
    }

    @GetMapping("/{userId}/collection-count")
    public ResponseEntity<Map<String, Long>> getOtherSavedCount(@PathVariable Long userId) {
        long count = profileService.getSavedCollectionCount(userId);
        return ResponseEntity.ok(Map.of("savedCount", count));
    }

}
