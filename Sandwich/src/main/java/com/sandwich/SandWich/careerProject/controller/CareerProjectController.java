package com.sandwich.SandWich.careerProject.controller;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.careerProject.dto.CareerProjectRequest;
import com.sandwich.SandWich.careerProject.dto.CareerProjectResponse;
import com.sandwich.SandWich.careerProject.service.CareerProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/career-projects")
public class CareerProjectController {

    private final CareerProjectService service;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CareerProjectRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        service.create(request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody CareerProjectRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        service.update(id, request, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        service.delete(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<CareerProjectResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(service.getMyProjects(userDetails.getId()));
    }

    @PatchMapping("/{id}/representative")
    public ResponseEntity<Map<String, Boolean>> toggle(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        boolean result = service.toggleRepresentative(id, userDetails.getId());
        return ResponseEntity.ok(Map.of("isRepresentative", result));
    }
}