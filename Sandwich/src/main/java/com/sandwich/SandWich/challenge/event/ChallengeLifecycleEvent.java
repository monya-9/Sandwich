package com.sandwich.SandWich.challenge.event;

import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;

public record ChallengeLifecycleEvent(
        Long challengeId,
        ChallengeType type,
        ChallengeStatus previous,
        ChallengeStatus next
) {}