package com.sandwich.SandWich.grader.web;

import com.sandwich.SandWich.grader.GradeRequestService;
import com.sandwich.SandWich.grader.GraderProperties;
import com.sandwich.SandWich.grader.dto.GradeRequest;
import com.sandwich.SandWich.grader.dto.GradeRequestPreview;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/_dev/grader")
@RequiredArgsConstructor
public class GraderDevController {

    private final GraderProperties props;
    private final GradeRequestService service;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "enabled", props.isEnabled(),
                "endpoint", props.getEndpoint(),
                "keyId", props.getKeyId()
        );
    }

    @PostMapping("/replay/{submissionId}")
    public ResponseEntity<?> replay(@PathVariable Long submissionId,
                                    @RequestHeader(value = "X-Dry-Run", required = false) String dry) {
        if ("1".equals(dry)) {
            var req = new GradeRequest(
                    "sub-" + submissionId, submissionId, 0L, "python", "app/main.py",
                    new GradeRequest.Repo("https://example.com/repo.git", "deadbeef"),
                    new GradeRequest.Limits(600, 1024, 1),
                    new GradeRequest.Callback(props.getCallbackUrl(),
                            new GradeRequest.Callback.Auth("HMAC", props.getKeyId())),
                    Instant.now(),
                    Map.of("title", "PREVIEW", "ownerId", 0)
            );
            GradeRequestPreview p = service.preview(req);
            return ResponseEntity.ok(p);
        }
        var r = service.sendForSubmission(submissionId);
        return ResponseEntity.status(r.httpStatus() == 0 ? 500 : r.httpStatus()).body(r);
    }
}