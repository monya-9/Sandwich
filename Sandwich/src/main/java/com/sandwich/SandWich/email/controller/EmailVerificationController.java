package com.sandwich.SandWich.email.controller;

import com.sandwich.SandWich.common.captcha.RecaptchaV2Service;
import com.sandwich.SandWich.email.dto.EmailSendRequest;
import com.sandwich.SandWich.email.dto.EmailVerifyRequest;
import com.sandwich.SandWich.email.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/email")
public class EmailVerificationController {


    private final EmailVerificationService emailService;
    private final RecaptchaV2Service recaptchaV2;

    @PostMapping("/send")
    public ResponseEntity<Void> sendCode(
            @RequestHeader(name = "X-Recaptcha-Token", required = false) String token,
            @RequestBody EmailSendRequest request
    ) {
        recaptchaV2.verifyOrThrow(token); // v2 검증
        emailService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verifyCode(@RequestBody EmailVerifyRequest request) {
        emailService.verifyCode(request.getEmail(), request.getCode());

        Map<String, Boolean> result = new HashMap<>();
        result.put("success", true); // 프론트에서 인식 가능하게

        return ResponseEntity.ok(result);
    }



}