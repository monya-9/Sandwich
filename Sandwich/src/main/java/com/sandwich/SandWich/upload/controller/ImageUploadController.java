package com.sandwich.SandWich.upload.controller;

import com.sandwich.SandWich.upload.util.S3Uploader;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/upload")
public class ImageUploadController {

    private final S3Uploader s3Uploader;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = s3Uploader.upload(file, "images");
        return ResponseEntity.ok(Map.of("url", imageUrl));
    }
}