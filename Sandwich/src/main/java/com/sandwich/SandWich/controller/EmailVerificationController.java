package com.sandwich.SandWich.controller;

import com.sandwich.SandWich.dto.EmailSendRequest;
import com.sandwich.SandWich.dto.EmailVerifyRequest;
import com.sandwich.SandWich.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/email")
public class EmailVerificationController {


    private final EmailVerificationService emailService;

    @PostMapping("/send")
    public ResponseEntity<Void> sendCode(@RequestBody EmailSendRequest request) {
        System.out.println("sendCode 실행됨!");
        emailService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Boolean> verifyCode(@RequestBody EmailVerifyRequest request) {
        boolean isValid = emailService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(isValid);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        System.out.println("📡 ping 호출됨");
        return ResponseEntity.ok("pong");
    }
}