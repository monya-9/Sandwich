package com.sandwich.SandWich.grader;


import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.Submission;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.repository.CodeSubmissionRepository;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.grader.dto.GradeRequest;
import com.sandwich.SandWich.grader.dto.GradeRequestPreview;
import com.sandwich.SandWich.grader.dto.GradeResponseEnvelope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeRequestService {

    private final GraderProperties props;
    private final GradeClient client;

    private final SubmissionRepository submissionRepo;
    private final CodeSubmissionRepository codeRepo;
    private final ChallengeRepository challengeRepo;

    /** 제출ID로 조회→요청 생성→전송 */
    public SendResult sendForSubmission(Long submissionId) {
        if (!props.isEnabled()) {
            return SendResult.skipped("sub-" + submissionId);
        }

        Submission s = submissionRepo.findById(submissionId).orElseThrow();
        var cs = codeRepo.findBySubmission_Id(submissionId).orElseThrow();
        Challenge ch = challengeRepo.findById(s.getChallenge().getId()).orElseThrow();

        GradeRequest req = new GradeRequest(
                "sub-" + s.getId(),
                s.getId(),
                ch.getId(),
                cs.getLanguage(),                 // 예: "python"
                cs.getEntrypoint(),               // 예: "app/main.py"
                new GradeRequest.Repo(s.getRepoUrl(), cs.getCommitSha()),
                new GradeRequest.Limits(600, 1024, 1),
                new GradeRequest.Callback(props.getCallbackUrl(),
                        new GradeRequest.Callback.Auth("HMAC", props.getKeyId())),
                Instant.now(),
                Map.of("ownerId", s.getOwnerId(), "title", s.getTitle())
        );

        return send(req);
    }

    /** 실제 전송(상태 분기 포함) */
    public SendResult send(GradeRequest req) {
        try {
            ResponseEntity<String> resp = client.post(req);
            int code = resp.getStatusCode().value();
            String body = resp.getBody();

            // 상태 판단
            if (code == 202 || code == 200) {
                GradeResponseEnvelope env = client.parseBody(body);
                String status = env != null ? env.status() : (code == 202 ? "QUEUED" : "ACCEPTED");
                return SendResult.ok(req.requestId(), code, status, body);
            }
            if (code == 409) { // 멱등 충돌: 성공 간주(이전 결과)
                return SendResult.ok(req.requestId(), code, "CONFLICT", body);
            }
            // 4xx: 실패 확정
            if (code >= 400 && code < 500) {
                return SendResult.fail(req.requestId(), code, body);
            }
            // 5xx: 여기 도달 시 재시도 모두 소진 — 실패
            if (code >= 500) {
                return SendResult.fail(req.requestId(), code, body);
            }
            // 그 외: 에러
            return SendResult.fail(req.requestId(), code, body);
        } catch (Exception e) {
            log.warn("[GRADER][ERR] id={} err={}", req.requestId(), e.toString());
            return SendResult.fail(req.requestId(), 0, e.toString());
        }
    }

    /** 드라이런: canonical/signature 미리보기 */
    public GradeRequestPreview preview(GradeRequest req) {
        var uri = URI.create(props.getEndpoint());
        var path = uri.getPath();
        try {
            var body = com.fasterxml.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(req);
            var ts = String.valueOf(Instant.now().getEpochSecond());
            var bodySha = HmacSigner.sha256Hex(body);
            var canonical = HmacSigner.canonical("POST", path, ts, bodySha);
            var sig = HmacSigner.hmacBase64(props.getHmacSecret(), canonical);
            return GradeRequestPreview.builder()
                    .requestId(req.requestId())
                    .timestamp(ts)
                    .canonical(canonical)
                    .signature(sig)
                    .bodySha256(bodySha)
                    .body(body)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    // 결과 뷰 모델
    public record SendResult(String requestId, int httpStatus, String state, String responseBody) {
        public static SendResult ok(String id, int code, String state, String body) {
            return new SendResult(id, code, state, body);
        }
        public static SendResult fail(String id, int code, String body) {
            return new SendResult(id, code, "ERROR", body);
        }
        public static SendResult skipped(String id) {
            return new SendResult(id, 200, "SKIPPED", "");
        }
    }
}