package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.discovery.service.HotDeveloperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/discovery/hot-developers")
public class HotDeveloperAdminController {

    private final HotDeveloperService hotDeveloperService;

    @PostMapping("/cache/evict")
    public ResponseEntity<String> evict() {
        hotDeveloperService.evictAll(); // @CacheEvict 동작
        return ResponseEntity.ok("evicted");
    }
}
