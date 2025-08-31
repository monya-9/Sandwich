package com.sandwich.SandWich.search.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.search.domain.RecentSearchType;
import com.sandwich.SandWich.search.dto.RecentSearchItem;
import com.sandwich.SandWich.search.dto.RecentSearchRequest;
import com.sandwich.SandWich.search.service.RecentSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search/recent")
public class RecentSearchController {

    private final RecentSearchService service;

    // 저장/업데이트(중복 시 최신화)
    @PostMapping
    public ResponseEntity<RecentSearchItem> add(
            @Validated @RequestBody RecentSearchRequest req,
            @AuthenticationPrincipal UserDetailsImpl principal
    ) {
        var user = principal.getUser();
        return ResponseEntity.ok(service.add(user, req));
    }

    // 조회 (type 필터 & limit 지원)
    @GetMapping
    public PageResponse<RecentSearchItem> list(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) RecentSearchType type,
            @AuthenticationPrincipal UserDetailsImpl principal
    ) {
        var user = principal.getUser();
        return service.list(user, limit, type);
    }

    // 단건 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOne(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl principal
    ) {
        service.deleteOne(principal.getUser(), id);
        return ResponseEntity.noContent().build();
    }

    // 전체 삭제 (옵션: 특정 type만)
    @DeleteMapping
    public ResponseEntity<Void> deleteAll(
            @RequestParam(required = false) RecentSearchType type,
            @AuthenticationPrincipal UserDetailsImpl principal
    ) {
        service.deleteAll(principal.getUser(), type);
        return ResponseEntity.noContent().build();
    }
}