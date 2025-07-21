package com.sandwich.SandWich.email.controller;

import com.sandwich.SandWich.email.dto.EmailSendRequest;
import com.sandwich.SandWich.email.dto.EmailVerifyRequest;
import com.sandwich.SandWich.email.service.EmailVerificationService;
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
    public ResponseEntity<Void> verifyCode(@RequestBody EmailVerifyRequest request) {
        emailService.verifyCode(request.getEmail(), request.getCode()); // 실패 시 예외 발생
        return ResponseEntity.ok().build(); // 성공만 OK 처리
    }


}