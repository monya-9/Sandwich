package com.sandwich.SandWich.notification.controller;


import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.notification.dto.PushRegisterRequest;
import com.sandwich.SandWich.notification.service.DeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/push")
public class PushRegisterController {

    private final DeviceTokenService svc;

    @PostMapping("/register")
    public ResponseEntity<?> register(@AuthenticationPrincipal UserDetailsImpl me,
                                      @RequestBody PushRegisterRequest req) {
        svc.register(me.getUser(), req);
        return ResponseEntity.ok().body(java.util.Map.of("ok", true));
    }

    // 선택: 특정 토큰 비활성화
    @DeleteMapping("/register")
    public ResponseEntity<?> unregister(@AuthenticationPrincipal UserDetailsImpl me,
                                        @RequestParam String token) {
        svc.unregister(me.getUser(), token);
        return ResponseEntity.ok().body(java.util.Map.of("ok", true));
    }
}
