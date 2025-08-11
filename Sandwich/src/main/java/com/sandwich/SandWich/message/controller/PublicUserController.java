package com.sandwich.SandWich.message.controller;

import com.sandwich.SandWich.message.dto.MessagePreferenceResponse;
import com.sandwich.SandWich.message.service.MessagePreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 공개 조회(상대 프로필 팝업에서 버튼 활성/비활성)
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/users")
class PublicUserController {
    private final MessagePreferenceService prefService;

    @GetMapping("/{userId}/message-preferences")
    public MessagePreferenceResponse getPublic(@PathVariable Long userId) {
        return prefService.getPublicFor(userId);
    }
}
