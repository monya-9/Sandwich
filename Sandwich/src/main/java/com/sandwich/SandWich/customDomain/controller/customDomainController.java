package com.sandwich.SandWich.customDomain.controller;

import com.sandwich.SandWich.customDomain.domain.customDomain;
import com.sandwich.SandWich.customDomain.service.customDomainService;
import com.sandwich.SandWich.customDomain.DTO.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-domains")
public class customDomainController {

    private final customDomainService customDomainService;

    @Autowired
    public customDomainController(customDomainService customDomainService) {
        this.customDomainService = customDomainService;
    }

    @PostMapping
    public ResponseEntity<?> createCustomDomain(@RequestBody customDomainRequest request) {
        try {
            customDomain customDomain = customDomainService.createCustomDomain(
                    request.getUserId(),
                    request.getProjectId(),
                    request.getCustomPath(),
                    request.getRealPath()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(customDomain);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create custom domain: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/resolve")
    public ResponseEntity<?> resolveCustomPath(@RequestParam("customPath") String customPath) {
        return customDomainService.getRealPathByCustomPath(customPath)
                .map(customDomain -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("realPath", customDomain.getRealPath());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "해당 사용자 지정 도메인을 찾을 수 없습니다. 도메인: " + customPath);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
                });
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomDomain(@PathVariable Long id, @RequestBody customDomainUpdateRequest request) {
        try {
            customDomain updatedDomain = customDomainService.updateCustomDomain(
                    id,
                    request.getCustomPath(),
                    request.getRealPath()
            );
            return ResponseEntity.ok(updatedDomain); // 200 OK
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update custom domain: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomDomain(@PathVariable Long id) {
        try {
            customDomainService.deleteCustomDomain(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to delete custom domain: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
