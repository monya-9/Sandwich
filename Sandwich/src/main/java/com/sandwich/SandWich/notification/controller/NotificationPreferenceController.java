package com.sandwich.SandWich.notification.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.notification.dto.NotificationPrefsResponse;
import com.sandwich.SandWich.notification.dto.NotificationPrefsUpdateRequest;
import com.sandwich.SandWich.notification.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications/prefs")
public class NotificationPreferenceController {

    private final NotificationPreferenceService service;

    @GetMapping("/me")
    public ResponseEntity<NotificationPrefsResponse> getMy(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(service.getMy(user.getUser().getId()));
    }

    // 부분 업데이트지만, 네 요구대로 PUT 사용 (null 필드는 무시)
    @PutMapping("/me")
    public ResponseEntity<NotificationPrefsResponse> updateMy(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody NotificationPrefsUpdateRequest req) {
        return ResponseEntity.ok(service.upsertMy(user.getUser().getId(), req));
    }
}
