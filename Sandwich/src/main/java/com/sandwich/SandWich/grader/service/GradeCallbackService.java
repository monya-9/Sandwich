package com.sandwich.SandWich.grader.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.challenge.domain.Submission;
import com.sandwich.SandWich.challenge.domain.SubmissionStatus;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.grader.domain.TestResult;
import com.sandwich.SandWich.grader.dto.GradeCallbackRequest;
import com.sandwich.SandWich.grader.repository.TestResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeCallbackService {

    private final SubmissionRepository submissionRepo;
    private final TestResultRepository testResultRepo;
    private final ObjectMapper om;

    @Transactional
    public void apply(GradeCallbackRequest req) {
        // 1) 제출 존재 확인 (404 처리)
        Submission s = submissionRepo.findById(req.submissionId())
                .orElseThrow(() -> new IllegalArgumentException("submission_not_found"));

        // 2) 업서트(멱등) - JSON 직렬화
        String scoreJson = toJson(req.scoreDetail());
        testResultRepo.upsert(
                req.submissionId(),
                n(req.passed()), n(req.failed()),
                req.coverage(), req.logsUrl(), req.aiComment(),
                scoreJson, req.totalScore()
        );

        // 3) 제출 상태만 enum으로 갱신
        s.setStatus(SubmissionStatus.SCORED);
        // (점수 필드 있으면) s.setScore(req.totalScore());

        // JPA dirty checking으로 커밋 시 반영
    }

    private static Integer n(Integer v){ return v == null ? 0 : v; }

    private String toJson(Object obj) {
        try { return obj == null ? null : om.writeValueAsString(obj); }
        catch (Exception e) { return null; }
    }
}