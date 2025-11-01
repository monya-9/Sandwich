package com.sandwich.SandWich.discovery.controller;

import com.sandwich.SandWich.discovery.dto.HotDeveloperDto;
import com.sandwich.SandWich.discovery.service.HotDeveloperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/discovery")
public class DiscoveryController {

    private final HotDeveloperService service;

    @GetMapping("/hot-developers")
    public ResponseEntity<List<HotDeveloperDto>> hot(
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50; // 안전 상한
        if (offset < 0) offset = 0;

        return ResponseEntity.ok(service.getHot(limit, offset));
    }
}
