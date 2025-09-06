package com.sandwich.SandWich.grader.web;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.grader.GraderProperties;
import com.sandwich.SandWich.grader.HmacVerifier;
import com.sandwich.SandWich.grader.dto.GradeCallbackRequest;
import com.sandwich.SandWich.grader.service.GradeCallbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestController
@RequestMapping("/internal/ai")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "grader.callback.enabled", havingValue = "true", matchIfMissing = true)
public class GradeCallbackController {

    private final GraderProperties props;
    private final HmacVerifier verifier;
    private final GradeCallbackService service;
    private final ObjectMapper om;

    @PostMapping("/grade-callback")
    public ResponseEntity<?> receive(@RequestBody String rawBody,
                                     @RequestHeader("X-Grade-Timestamp") String ts,
                                     @RequestHeader("X-Grade-Signature") String sig,
                                     @RequestHeader(value = "X-Grade-KeyId", required = false) String keyId,
                                     HttpServletRequest req) {
        try {
            // 1) 서명 검증
            String method = "POST";
            String path = req.getRequestURI(); // /internal/ai/grade-callback
            verifier.verify(method, path, ts, rawBody, sig, keyId);

            // 2) JSON 파싱
            GradeCallbackRequest body = om.readValue(rawBody, GradeCallbackRequest.class);

            // 3) 제출 존재 확인 + 반영
            service.apply(body);

            // 4) 멱등 재수신도 200(또는 202)로 OK
            return ResponseEntity.ok().build();

        } catch (IllegalStateException e) {
            // 서명/시간/키 불일치
            log.warn("[CALLBACK][401] {}", e.getMessage());
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            // submission_not_found 등
            log.warn("[CALLBACK][404] {}", e.getMessage());
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            log.warn("[CALLBACK][500] {}", e.toString());
            return ResponseEntity.internalServerError().build();
        }
    }
}