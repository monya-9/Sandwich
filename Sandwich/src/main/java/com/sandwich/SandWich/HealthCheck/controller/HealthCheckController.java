package com.sandwich.SandWich.HealthCheck.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {

    // ALB 헬스 체크 경로: /health
    @GetMapping("/health")
    public ResponseEntity<String> checkHealth() {
        // 복잡한 로직 없이 200 OK와 간단한 문자열만 반환
        return ResponseEntity.ok("Sandwich API is healthy");
    }
}