package com.sandwich.SandWich.message.screenshot.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.screenshot.dto.ScreenshotRangeQuery;
import com.sandwich.SandWich.message.service.MessageScreenshotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageScreenshotRangeController {

    private final MessageScreenshotService svc;

    // PNG
    @GetMapping(value = "/{roomId}/screenshot.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> screenshotPng(@AuthenticationPrincipal UserDetailsImpl principal,
                                                @PathVariable Long roomId,
                                                @Valid @ModelAttribute ScreenshotRangeQuery q) {
        Long meId = principal.getId();
        int width = q.widthOrDefault() * q.scaleOrDefault(); // scale을 width에 반영
        byte[] png = svc.screenshotRangePng(meId, roomId, q.getFromId(), q.getToId(),
                width, q.themeOrDefault(), q.scaleOrDefault(), ZoneId.of("Asia/Seoul"));

        String filename = "room-" + roomId + "_" + q.getFromId() + "-" + q.getToId()
                + "_" + q.themeOrDefault() + "@" + q.scaleOrDefault() + "x.png";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }

    // PDF
    @GetMapping(value = "/{roomId}/screenshot.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> screenshotPdf(@AuthenticationPrincipal UserDetailsImpl principal,
                                                @PathVariable Long roomId,
                                                @Valid @ModelAttribute ScreenshotRangeQuery q) {
        Long meId = principal.getId();
        byte[] pdf = svc.screenshotRangePdf(meId, roomId, q.getFromId(), q.getToId(),
                q.widthOrDefault(), q.themeOrDefault(), ZoneId.of("Asia/Seoul"));

        String filename = "room-" + roomId + "_" + q.getFromId() + "-" + q.getToId()
                + "_" + q.themeOrDefault() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}