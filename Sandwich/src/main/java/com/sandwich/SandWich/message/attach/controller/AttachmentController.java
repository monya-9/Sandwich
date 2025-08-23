package com.sandwich.SandWich.message.attach.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.attach.config.FileSecurityProperties;
import com.sandwich.SandWich.message.attach.domain.AttachmentMetadata;
import com.sandwich.SandWich.message.attach.service.AttachmentService;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService service;
    private final StorageService storage;
    private final FileSecurityProperties props;

    @PostMapping(value = "/api/messages/{roomId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable Long roomId,
                                    @AuthenticationPrincipal UserDetailsImpl me,
                                    @RequestPart("file") MultipartFile file) {
        Object messageDto = service.upload(roomId, me.getUser(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(messageDto);
    }

    @GetMapping("/api/files/{filename}")
    public ResponseEntity<?> download(@PathVariable String filename,
                                      @AuthenticationPrincipal UserDetailsImpl me) {
        AttachmentMetadata md = service.getForDownload(filename, me.getUser().getId());

        if ("s3".equalsIgnoreCase(props.getStorage())) {
            URL url = service.presignIfS3(md.getStorageKey());
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url.toString())).build();
        }

        Resource resource = storage.loadAsResource(md.getStorageKey());
        String cd = ContentDisposition.attachment()
                .filename(md.getOriginalFilename(), StandardCharsets.UTF_8).build().toString();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd)
                .contentType(MediaType.parseMediaType(md.getMimeType()))
                .contentLength(md.getSize())
                .body(resource);
    }
}