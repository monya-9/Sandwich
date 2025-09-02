package com.sandwich.SandWich.challenge.event;

public record SubmissionCreatedEvent(Long submissionId, Long challengeId, Long ownerId, String title, String repoUrl, String demoUrl) {}