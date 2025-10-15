package com.sandwich.SandWich.deploy.controller;

import com.sandwich.SandWich.deploy.service.DeployFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/deploy/files")
public class DeployFileController {

    private final DeployFileService deployFileService;

    @PostMapping("/{userId}/{projectId}")
    public ResponseEntity<?> uploadFile(
            @PathVariable String userId,
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String fileUrl = deployFileService.uploadFile(userId, projectId, file);
            return ResponseEntity.ok(fileUrl);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFile(@RequestParam String fileUrl) {
        try {
            deployFileService.deleteFile(fileUrl);
            return ResponseEntity.ok("deleted");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}