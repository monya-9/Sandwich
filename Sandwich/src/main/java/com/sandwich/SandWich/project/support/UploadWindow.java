package com.sandwich.SandWich.project.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

public enum UploadWindow {
    LAST_24H, LAST_7D, LAST_1M, LAST_3M;

    public Instant since(Clock clock) {
        Instant now = clock.instant();
        return switch (this) {
            case LAST_24H -> now.minus(Duration.ofHours(24));
            case LAST_7D  -> now.minus(Duration.ofDays(7));
            case LAST_1M  -> now.minus(Duration.ofDays(30));
            case LAST_3M  -> now.minus(Duration.ofDays(90));
        };
    }
}