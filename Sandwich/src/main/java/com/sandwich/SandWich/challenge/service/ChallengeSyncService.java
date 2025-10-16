package com.sandwich.SandWich.challenge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.dto.SyncAiDtos;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.internal.ai.AiRecoClient;
import java.time.*;
import java.time.temporal.WeekFields;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ChallengeSyncService {

    private final ChallengeRepository repo;
    private final ObjectMapper om = new ObjectMapper();
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final AiRecoClient ai;

    @Transactional
    public Challenge upsertMonthlyPortfolio(SyncAiDtos.MonthlyReq req) {
        if (!req.isFound()) throw new BadRequestException("NOT_FOUND", "AI 데이터가 없습니다.");
        var d = req.getData();
        if (d == null) throw new BadRequestException("BAD_DATA", "data가 비었습니다.");

        // 날짜 자동 계산 (월 1일 00:00:00 ~ 말일 23:59:59, 투표: 다음달 1~3일)
        var month = YearMonth.parse(req.getYm()); // "YYYY-MM"
        var start = month.atDay(1).atTime(0,0,0).atZone(ZONE).toOffsetDateTime();
        var end   = month.atEndOfMonth().atTime(23,59,59).atZone(ZONE).toOffsetDateTime();
        var voteStart = month.plusMonths(1).atDay(1).atTime(0,0,0).atZone(ZONE).toOffsetDateTime();
        var voteEnd   = month.plusMonths(1).atDay(3).atTime(23,59,59).atZone(ZONE).toOffsetDateTime();

        // rule_json 구성
        ObjectNode rule = om.createObjectNode();
        rule.put("source", "ai");
        rule.put("month", req.getYm());
        rule.put("summary", d.getSummary());
        rule.put("description", d.getDescription());
        rule.set("mustHave", om.valueToTree(d.getMustHave()));
        rule.set("requirements", om.valueToTree(d.getRequirements()));
        rule.set("tips", om.valueToTree(d.getTips()));

        var type = ChallengeType.PORTFOLIO;
        var title = d.getTitle();

        // 자연키: (type, title, startAt)
        var existing = repo.findByTypeAndTitleAndStartAt(type, title, start);
        if (existing.isPresent()) {
            var c = existing.get();
            c.setEndAt(end);
            c.setVoteStartAt(voteStart);
            c.setVoteEndAt(voteEnd);
            c.setRuleJson(rule);
            return repo.save(c);
        }

        var c = Challenge.builder()
                .type(type)
                .title(title)
                .ruleJson(rule)
                .startAt(start)
                .endAt(end)
                .voteStartAt(voteStart)
                .voteEndAt(voteEnd)
                .status(ChallengeStatus.DRAFT)
                .build();
        return repo.save(c);
    }

    @Transactional
    public Challenge upsertWeeklyCode(SyncAiDtos.WeeklyReq req) {
        if (!req.isFound()) throw new BadRequestException("NOT_FOUND", "AI 데이터가 없습니다.");
        var d = req.getData();
        if (d == null) throw new BadRequestException("BAD_DATA", "data가 비었습니다.");

        // ISO 주차 파싱: "YYYYWww"
        // 주 시작(월) 00:00:00 ~ 주 종료(일) 23:59:59 (KST)
        var wf = WeekFields.ISO;
        int year = Integer.parseInt(req.getWeek().substring(0,4));
        int week = Integer.parseInt(req.getWeek().substring(5)); // after 'W'
        var first = LocalDate
                .of(year, 1, 4) // ISO week anchor
                .with(wf.weekOfWeekBasedYear(), week)
                .with(wf.dayOfWeek(), 1); // Monday
        var last = first.plusDays(6); // Sunday

        var start = first.atTime(0,0,0).atZone(ZONE).toOffsetDateTime();
        var end   = last.atTime(23,59,59).atZone(ZONE).toOffsetDateTime();

        ObjectNode rule = om.createObjectNode();
        rule.put("source", "ai");
        rule.put("week", req.getWeek());
        rule.put("summary", d.getSummary());
        rule.put("description", d.getDescription());
        rule.set("mustHave", om.valueToTree(d.getMustHave()));
        rule.set("requirements", om.valueToTree(d.getRequirements()));
        rule.set("tips", om.valueToTree(d.getTips()));

        var type = ChallengeType.CODE;
        var title = d.getTitle();

        var existing = repo.findByTypeAndTitleAndStartAt(type, title, start);
        if (existing.isPresent()) {
            var c = existing.get();
            c.setEndAt(end);
            c.setVoteStartAt(null); // 코드 챌린지는 투표 미사용
            c.setVoteEndAt(null);
            c.setRuleJson(rule);
            return repo.save(c);
        }

        var c = Challenge.builder()
                .type(type)
                .title(title)
                .ruleJson(rule)
                .startAt(start)
                .endAt(end)
                .voteStartAt(null)
                .voteEndAt(null)
                .status(ChallengeStatus.DRAFT)
                .build();
        return repo.save(c);
    }

    @Transactional
    public Challenge fetchAndUpsertMonthly(String ymOrNull) {
        AiRecoClient.MonthlyResp r = (ymOrNull == null || ymOrNull.isBlank())
                ? ai.getLatestMonthly()
                : ai.getMonthly(ymOrNull);

        if (!r.found()) throw new com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException("NOT_FOUND","AI monthly 없음");

        // 프론트 요구 포맷으로 매핑 후 기존 메서드 재사용
        var req = new com.sandwich.SandWich.challenge.dto.SyncAiDtos.MonthlyReq();
        req.setYm(r.ym());
        req.setFound(true);
        var d = new com.sandwich.SandWich.challenge.dto.SyncAiDtos.MonthlyReq.MonthlyData();
        d.setTitle(r.data().title());
        d.setSummary(r.data().summary());
        d.setDescription(null); // AI 응답에 없으면 null
        d.setMustHave(r.data().must_have()); // 필드명이 must_have → mustHave로 매핑
        d.setRequirements(null);
        d.setTips(null);
        req.setData(d);

        return upsertMonthlyPortfolio(req);
    }

    // 주간: AI에서 가져와서 우리 코드 업서트
    @Transactional
    public Challenge fetchAndUpsertWeekly(String weekOrNull) {
        AiRecoClient.WeeklyResp r = (weekOrNull == null || weekOrNull.isBlank())
                ? ai.getLatestWeekly()
                : ai.getWeekly(weekOrNull);

        if (!r.found()) throw new com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException("NOT_FOUND","AI weekly 없음");

        var req = new com.sandwich.SandWich.challenge.dto.SyncAiDtos.WeeklyReq();
        req.setWeek(r.week());
        req.setFound(true);
        var d = new com.sandwich.SandWich.challenge.dto.SyncAiDtos.WeeklyReq.WeeklyData();
        d.setTitle(r.data().title());
        d.setSummary(r.data().summary());
        d.setDescription(null);
        d.setMustHave(r.data().must_have());
        d.setRequirements(null);
        d.setTips(null);
        req.setData(d);

        return upsertWeeklyCode(req);
    }
}
