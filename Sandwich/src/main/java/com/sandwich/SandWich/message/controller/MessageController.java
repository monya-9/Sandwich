package com.sandwich.SandWich.message.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
