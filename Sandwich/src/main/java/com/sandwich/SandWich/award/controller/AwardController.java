package com.sandwich.SandWich.award.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.award.dto.AwardRequest;
import com.sandwich.SandWich.award.dto.AwardResponse;
import com.sandwich.SandWich.award.service.AwardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/awards")
public class AwardController {

    private final AwardService awardService;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody AwardRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        awardService.create(request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody AwardRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        awardService.update(id, request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        awardService.delete(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<AwardResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(awardService.getMyAwards(userDetails.getId()));
    }

    @PatchMapping("/{id}/representative")
    public ResponseEntity<Map<String, Boolean>> toggle(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        boolean result = awardService.toggleRepresentative(id, userDetails.getId());
        return ResponseEntity.ok(Map.of("isRepresentative", result));
    }
}
