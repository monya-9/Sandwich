package com.sandwich.SandWich.career.controller;

import com.sandwich.SandWich.career.dto.CareerRequest;
import com.sandwich.SandWich.career.dto.CareerResponse;
import com.sandwich.SandWich.career.service.CareerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/careers")
public class CareerController {

    private final CareerService careerService;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CareerRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        careerService.createCareer(request, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody CareerRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        careerService.updateCareer(id, request, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        careerService.deleteCareer(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<CareerResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(careerService.getMyCareers(userDetails.getId()));
    }

    @PatchMapping("/{id}/representative")
    public ResponseEntity<Map<String, Boolean>> toggleRepresentative(@PathVariable Long id,
                                                                     @AuthenticationPrincipal UserDetailsImpl userDetails) {
        boolean result = careerService.toggleRepresentative(id, userDetails.getId());
        return ResponseEntity.ok(Map.of("isRepresentative", result));
    }
}
