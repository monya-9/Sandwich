package com.sandwich.SandWich.reward;

import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name="reward.autoPublishOnEnd", havingValue="true")
public class RewardAutoPublishListener {

    private final RewardPayoutService service;

    @Value("${reward.rule.top:10000,5000,3000}")
    private String topCsv;

    @Value("${reward.rule.participant:0}")
    private long participant;

    @EventListener
    public void onEnded(ChallengeLifecycleEvent e) {
        if (e.next() != ChallengeStatus.ENDED) return;
        if (e.type() != ChallengeType.PORTFOLIO) return; // 포트폴리오만 자동 집계

        List<Long> top = Arrays.stream(topCsv.split(","))
                .filter(s -> !s.isBlank())
                .map(Long::parseLong).toList();

        var rule = new RewardRule(top, participant > 0 ? participant : null);
        int inserted = service.publishPortfolioResults(e.challengeId(), rule);
        // 필요하면 여기서 로깅/푸시
    }
}
