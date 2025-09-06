package com.sandwich.SandWich.grader;

import com.sandwich.SandWich.challenge.event.CodeSubmissionCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class GradeProducerListener {

    private final GraderProperties props;
    private final GradeRequestService service;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCodeSubmissionCreated(CodeSubmissionCreatedEvent ev) {
        if (!props.isEnabled()) {
            log.info("[GRADER][SKIP] disabled subId={}", ev.submissionId());
            return;
        }
        var r = service.sendForSubmission(ev.submissionId());
        log.info("[GRADER][SEND] subId={} state={} http={}", ev.submissionId(), r.state(), r.httpStatus());
        // PR7 정책: 202 받아도 상태 전환은 보수적으로 PR8 콜백에서 처리
    }
}