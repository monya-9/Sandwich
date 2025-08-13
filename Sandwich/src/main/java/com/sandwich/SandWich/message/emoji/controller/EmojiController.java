package com.sandwich.SandWich.message.emoji.controller;

import com.sandwich.SandWich.message.emoji.dto.EmojiPageResponse;
import com.sandwich.SandWich.message.emoji.service.EmojiCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/emojis")
public class EmojiController {
    private final EmojiCatalogService catalog;

    // 카테고리 탭
    @GetMapping("/categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)))
                .body(catalog.getCategories());
    }

    // 검색 + 페이지네이션
    @GetMapping
    public ResponseEntity<EmojiPageResponse> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "60") int size
    ) {
        EmojiPageResponse body = catalog.search(category, q, page, size);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1))) // 거의 정적 데이터
                .body(body);
    }
}
