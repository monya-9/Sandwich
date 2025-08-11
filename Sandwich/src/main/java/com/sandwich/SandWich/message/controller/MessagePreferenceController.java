package com.sandwich.SandWich.message.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.dto.MessagePreferenceResponse;
import com.sandwich.SandWich.message.dto.UpdateMessagePreferenceRequest;
import com.sandwich.SandWich.message.service.MessagePreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class MessagePreferenceController {
    private final MessagePreferenceService service;

    @GetMapping("/message-preferences/me")
    public MessagePreferenceResponse getMine(@AuthenticationPrincipal UserDetailsImpl me) {
        return service.getMy(me.getUser());
    }

    @PutMapping("/message-preferences/me")
    public MessagePreferenceResponse updateMine(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestBody @Valid UpdateMessagePreferenceRequest req) {
        return service.updateMy(me.getUser(), req);
    }

}

