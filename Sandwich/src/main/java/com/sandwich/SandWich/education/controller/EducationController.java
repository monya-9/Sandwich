package com.sandwich.SandWich.education.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.education.dto.EducationRequest;
import com.sandwich.SandWich.education.dto.EducationResponse;
import com.sandwich.SandWich.education.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/educations")
public class EducationController {

    private final EducationService educationService;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody EducationRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        educationService.create(request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody EducationRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        educationService.update(id, request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        educationService.delete(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<EducationResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(educationService.getMyEducations(userDetails.getId()));
    }

    @PatchMapping("/{id}/representative")
    public ResponseEntity<Map<String, Boolean>> toggle(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        boolean result = educationService.toggleRepresentative(id, userDetails.getId());
        return ResponseEntity.ok(Map.of("isRepresentative", result));
    }
}
