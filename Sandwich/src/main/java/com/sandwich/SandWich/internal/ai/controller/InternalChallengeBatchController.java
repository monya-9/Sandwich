package com.sandwich.SandWich.internal.ai.controller;

import com.sandwich.SandWich.internal.ai.service.ChallengeBatchService;
import com.sandwich.SandWich.internal.ai.dto.BatchDtos.BatchReq;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/ai/challenges")
@RequiredArgsConstructor
public class InternalChallengeBatchController {

    private final ChallengeBatchService batchService;

    @PostMapping("/batch")
    @PreAuthorize("hasAuthority('SCOPE_CHALLENGE_BATCH_WRITE')")
    public ResponseEntity<?> batch(@RequestBody @Validated BatchReq req,
                                   @RequestHeader(value = "Idempotency-Key", required = false) String idemKey) {
        batchService.ingest(req, idemKey);
        return ResponseEntity.accepted().build();
    }
}
