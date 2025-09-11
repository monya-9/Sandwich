package com.sandwich.SandWich.notification.controller;

import com.sandwich.SandWich.notification.dto.*;
import com.sandwich.SandWich.notification.service.NotificationLedgerService;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationLedgerService svc;

    @GetMapping("/unread-count")
    public UnreadCountResponse unread(@AuthenticationPrincipal UserDetailsImpl me) {
        Long meId = me.getUser().getId();
        log.info("[API] /unread-count me.id={}", meId);   // ★ 내 id 확인
        return svc.unreadCount(meId);
    }

    @GetMapping
    public NotificationListResponse list(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String cursor
    ) {
        return svc.list(me.getId(), size, cursor);
    }

    @PatchMapping("/read")
    public MarkReadResponse read(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestBody MarkReadRequest req
    ) {
        return svc.markRead(me.getId(), req.getIds());
    }

    @PostMapping("/read-all")
    public MarkReadResponse readAll(@AuthenticationPrincipal UserDetailsImpl me) {
        return svc.markAll(me.getId());
    }
}
