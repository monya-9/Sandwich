package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.dto.SubmissionDtos;
import com.sandwich.SandWich.challenge.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challenges/{challengeId}/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService service;

    @PostMapping
    public IdResp create(@PathVariable Long challengeId, @RequestBody @Valid SubmissionDtos.CreateReq req) {
        Long id = service.createPortfolio(challengeId, req);
        return new IdResp(id);
    }

    @GetMapping
    public Page<SubmissionDtos.Item> list(
            @PathVariable Long challengeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort
    ) {
        String[] s = sort.split(",");
        var dir = (s.length > 1 && "asc".equalsIgnoreCase(s[1])) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, s[0]));
        return service.list(challengeId, pageable);
    }

    public record IdResp(Long id) {}
}