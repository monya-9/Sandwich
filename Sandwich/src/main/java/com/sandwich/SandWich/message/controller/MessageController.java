package com.sandwich.SandWich.message.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.service.MessageScreenshotService;
import com.sandwich.SandWich.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final MessageScreenshotService messageScreenshotService;

    @PostMapping
    public MessageResponse send(@AuthenticationPrincipal UserDetailsImpl me,
                                @RequestBody @Valid SendMessageRequest req) {
        return messageService.send(me.getUser(), req);
    }

    @PatchMapping("/{roomId}/read")
    public Map<String, Object> markRead(@AuthenticationPrincipal UserDetailsImpl me,
                                        @PathVariable Long roomId) {
        int updated = messageService.markRoomAsRead(me.getUser(), roomId);
        return Map.of("roomId", roomId, "updatedCount", updated);
    }

    @GetMapping("/{messageId}")
    public MessageResponse getOne(@AuthenticationPrincipal UserDetailsImpl me,
                                  @PathVariable Long messageId) {
        return messageService.getMessage(me.getUser(), messageId);
    }

    @GetMapping("/{roomId}/screenshot")
    public ResponseEntity<byte[]> screenshot(
            @AuthenticationPrincipal UserDetailsImpl me,
            @PathVariable Long roomId,
            @RequestParam(required = false, defaultValue = "Asia/Seoul") String tz,
            @RequestParam(required = false, defaultValue = "960") int width,
            @RequestParam(required = false, defaultValue = "light") String theme
    ) {
        java.time.ZoneId zone = java.time.ZoneId.of(tz);
        byte[] png = messageScreenshotService.screenshotRoom(me.getUser(), roomId, width, theme, zone);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"room-%d.png\"".formatted(roomId))
                .header("Content-Type", "image/png")
                .body(png);
    }



}
