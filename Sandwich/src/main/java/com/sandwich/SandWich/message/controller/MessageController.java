package com.sandwich.SandWich.message.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

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

}
