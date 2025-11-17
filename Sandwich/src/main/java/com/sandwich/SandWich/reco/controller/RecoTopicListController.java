package com.sandwich.SandWich.reco.controller;

import com.sandwich.SandWich.internal.ai.AiRecoClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/ext/reco/topics")
public class RecoTopicListController {

    private final AiRecoClient aiRecoClient;

    /**
     * 프론트: /ext/reco/topics/weekly/list
     * AI 서버: /api/reco/topics/weekly/list
     */
    @GetMapping("/weekly/list")
    public AiRecoClient.WeeklyTopicListResp weeklyList() {
        log.debug("[RecoTopicList] weekly list requested");
        return aiRecoClient.getWeeklyTopicList();
    }

    /**
     * 프론트: /ext/reco/topics/monthly/list
     * AI 서버: /api/reco/topics/monthly/list
     */
    @GetMapping("/monthly/list")
    public AiRecoClient.MonthlyTopicListResp monthlyList() {
        log.debug("[RecoTopicList] monthly list requested");
        return aiRecoClient.getMonthlyTopicList();
    }
}
