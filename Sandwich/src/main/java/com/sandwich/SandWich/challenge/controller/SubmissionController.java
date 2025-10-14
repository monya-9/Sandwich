package com.sandwich.SandWich.challenge.controller;

import com.sandwich.SandWich.challenge.dto.SubmissionDtos;
import com.sandwich.SandWich.challenge.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challenges/{challengeId}/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService service;

    @PostMapping
    public CreatedResp create(@PathVariable Long challengeId, @RequestBody @Valid SubmissionDtos.CreateReq req) {
        return service.createAndReturn(challengeId, req);
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

    @GetMapping("/{submissionId}")
    public SubmissionDtos.Item get(
            @PathVariable Long challengeId,
            @PathVariable Long submissionId,
            @org.springframework.lang.Nullable @AuthenticationPrincipal com.sandwich.SandWich.auth.security.UserDetailsImpl user,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return service.getAndIncreaseView(challengeId, submissionId,
                (user==null? null : user.getUser().getId()), request);
    }

    public record CreatedResp(Long id, String status, java.time.OffsetDateTime createdAt) {}
}