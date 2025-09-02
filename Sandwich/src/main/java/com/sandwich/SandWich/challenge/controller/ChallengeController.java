package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.domain.*;
import com.sandwich.SandWich.challenge.dto.*;
import com.sandwich.SandWich.challenge.service.ChallengeQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeQueryService service;

    @GetMapping
    public Page<ChallengeListItem> list(
            @RequestParam(value = "type", required = false) ChallengeType type,
            @RequestParam(value = "status", required = false) ChallengeStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "startAt,desc") String sort
    ) {
        String[] s = sort.split(",");
        String field = s[0];
        Sort.Direction dir = (s.length > 1 && "asc".equalsIgnoreCase(s[1])) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        return service.list(type, status, pageable);
    }

    @GetMapping("/{id}")
    public ChallengeDetail get(@PathVariable Long id) {
        return service.get(id);
    }
}