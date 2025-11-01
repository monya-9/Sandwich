package com.sandwich.SandWich.admin.controller;

import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLog;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/challenges/sync-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SyncLogAdminController {

    private final ChallengeSyncLogRepository repo;

    @GetMapping
    public Page<ChallengeSyncLog> list(
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String aiMonth,
            @RequestParam(required = false) String aiWeek,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Specification<ChallengeSyncLog> spec = Specification.where(null);
        if (method  != null && !method.isBlank())  spec = spec.and((root, q, cb) -> cb.equal(root.get("method"),  method));
        if (aiMonth != null && !aiMonth.isBlank()) spec = spec.and((root, q, cb) -> cb.equal(root.get("aiMonth"), aiMonth));
        if (aiWeek  != null && !aiWeek.isBlank())  spec = spec.and((root, q, cb) -> cb.equal(root.get("aiWeek"),  aiWeek));

        return repo.findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public ChallengeSyncLog get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
