package com.sandwich.SandWich.challenge.notify;

import com.sandwich.SandWich.challenge.event.SubmissionCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component @RequiredArgsConstructor
public class SubmissionEventListener {
    private final ServiceAccountNotifier notifier;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(SubmissionCreatedEvent ev) {
        notifier.onSubmissionCreated(ev.submissionId(), ev.challengeId(), ev.ownerId(), ev.title(), ev.repoUrl(), ev.demoUrl());
    }
}