package com.sandwich.SandWich.reward.service;

import java.util.List;
public record RewardRule(List<Long> top, Long participant) {
    public List<Long> safeTop() { return top == null ? List.of() : top; }
    public long safeParticipant() { return participant == null ? 0L : participant; }
}