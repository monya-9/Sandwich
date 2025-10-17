package com.sandwich.SandWich.challenge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sandwich.SandWich.auth.CurrentUserProvider;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.dto.SyncAiDtos;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLogRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.internal.ai.AiRecoClient;
import java.time.*;
import java.time.temporal.WeekFields;
import com.fasterxml.jackson.databind.JsonNode;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLog;

@Service
@RequiredArgsConstructor
public class ChallengeSyncService {

    private final ChallengeRepository repo;
    private final ObjectMapper om = new ObjectMapper();
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final AiRecoClient ai;
    private final ChallengeSyncLogRepository logs;
    private final CurrentUserProvider currentUser;

    @Transactional
    public Challenge upsertMonthlyPortfolio(SyncAiDtos.MonthlyReq req) {
        if (!req.isFound()) throw new BadRequestException("NOT_FOUND", "AI 데이터가 없습니다.");
        var d = req.getData();
        if (d == null) throw new BadRequestException("BAD_DATA", "data가 비었습니다.");

        var month = YearMonth.parse(req.getYm()); // "YYYY-MM"
        var start = month.atDay(1).atTime(0,0,0).atZone(ZONE).toOffsetDateTime();
        var end   = month.atEndOfMonth().atTime(23,59,59).atZone(ZONE).toOffsetDateTime();
        var voteStart = month.plusMonths(1).atDay(1).atTime(0,0,0).atZone(ZONE).toOffsetDateTime();
        var voteEnd   = month.plusMonths(1).atDay(3).atTime(23,59,59).atZone(ZONE).toOffsetDateTime();

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

        var existing = repo.findByTypeAndTitleAndStartAt(type, title, start);

        Challenge c = existing.orElseGet(() -> Challenge.builder()
                .type(type)
                .title(title)
                .startAt(start)
                .status(ChallengeStatus.DRAFT)
                .build());

        c.setEndAt(end);
        c.setVoteStartAt(voteStart);
        c.setVoteEndAt(voteEnd);
        c.setRuleJson(rule);

        c.setSource("AI_PUSH");
        c.setAiMonth(req.getYm());
        c.setAiWeek(null);
        c.setIdempotencyKey(null);

        var saved = repo.save(c);

        writeLog("PUSH_MONTHLY", "SUCCESS", req.getYm(), null, null,
                om.valueToTree(req), mapResult(saved));
        return saved;
    }

    @Transactional
    public Challenge upsertWeeklyCode(SyncAiDtos.WeeklyReq req) {
        if (!req.isFound()) throw new BadRequestException("NOT_FOUND", "AI 데이터가 없습니다.");
        var d = req.getData();
        if (d == null) throw new BadRequestException("BAD_DATA", "data가 비었습니다.");

        var wf = WeekFields.ISO;
        int year = Integer.parseInt(req.getWeek().substring(0,4));
        int week = Integer.parseInt(req.getWeek().substring(5));
        var first = LocalDate.of(year, 1, 4)
                .with(wf.weekOfWeekBasedYear(), week)
                .with(wf.dayOfWeek(), 1); // Monday
        var last = first.plusDays(6);     // Sunday

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

        Challenge c = existing.orElseGet(() -> Challenge.builder()
                .type(type)
                .title(title)
                .startAt(start)
                .status(ChallengeStatus.DRAFT)
                .build());

        c.setEndAt(end);
        c.setVoteStartAt(null);
        c.setVoteEndAt(null);
        c.setRuleJson(rule);

        c.setSource("AI_PUSH");
        c.setAiMonth(null);
        c.setAiWeek(req.getWeek());
        c.setIdempotencyKey(null);

        var saved = repo.save(c);

        writeLog("PUSH_WEEKLY", "SUCCESS", null, req.getWeek(), null,
                om.valueToTree(req), mapResult(saved));
        return saved;
    }


    @Transactional
    public Challenge fetchAndUpsertMonthly(String ymOrNull) {
        AiRecoClient.MonthlyResp r = (ymOrNull == null || ymOrNull.isBlank())
                ? ai.getLatestMonthly()
                : ai.getMonthly(ymOrNull);

        if (!r.found()) throw new BadRequestException("NOT_FOUND","AI monthly 없음");
        var req = new SyncAiDtos.MonthlyReq();
        req.setYm(r.ym());
        req.setFound(true);
        var d = new SyncAiDtos.MonthlyReq.MonthlyData();
        d.setTitle(r.data().title());
        d.setSummary(r.data().summary());
        d.setDescription(null);
        d.setMustHave(r.data().must_have());
        d.setRequirements(null); d.setTips(null);
        req.setData(d);

        var saved = upsertMonthlyPortfolio(req);

        // ✔ fetch로 들어온 건 출처를 FETCH로 덮어씌워줌
        saved.setSource("AI_FETCH");
        saved.setAiMonth(req.getYm());
        saved.setAiWeek(null);
        repo.save(saved);

        writeLog("FETCH_MONTHLY", "SUCCESS", req.getYm(), null, null,
                om.valueToTree(r), mapResult(saved));
        return saved;
    }

    // 주간: AI에서 가져와서 우리 코드 업서트
    @Transactional
    public Challenge fetchAndUpsertWeekly(String weekOrNull) {
        var r = (weekOrNull == null || weekOrNull.isBlank()) ? ai.getLatestWeekly() : ai.getWeekly(weekOrNull);
        if (!r.found()) throw new BadRequestException("NOT_FOUND","AI weekly 없음");

        var req = new SyncAiDtos.WeeklyReq();
        req.setWeek(r.week());
        req.setFound(true);
        var d = new SyncAiDtos.WeeklyReq.WeeklyData();
        d.setTitle(r.data().title());
        d.setSummary(r.data().summary());
        d.setDescription(null);
        d.setMustHave(r.data().must_have());
        d.setRequirements(null); d.setTips(null);
        req.setData(d);

        var saved = upsertWeeklyCode(req);

        saved.setSource("AI_FETCH");
        saved.setAiMonth(null);
        saved.setAiWeek(req.getWeek());
        repo.save(saved);

        writeLog("FETCH_WEEKLY", "SUCCESS", null, req.getWeek(), null,
                om.valueToTree(r), mapResult(saved));
        return saved;
    }

    private void writeLog(String method, String status,
                          String aiMonth, String aiWeek, String idemKey,
                          JsonNode request, JsonNode result) {
        Long actorId = null; String actorType = "SERVICE";
        try { actorId = currentUser.currentUserId(); actorType = "ADMIN"; } catch (Exception ignore) {}
        var log = ChallengeSyncLog.builder()
                .actorType(actorType).actorId(actorId)
                .method(method)
                .aiMonth(aiMonth).aiWeek(aiWeek)
                .idempotencyKey(idemKey)
                .requestJson(request).resultJson(result)
                .status(status).message(null)
                .createdCount(0).updatedCount(1).skippedCount(0).errorCount(0)
                .build();
        logs.save(log);
    }

    private JsonNode mapResult(Challenge c) {
        var o = om.createObjectNode();
        o.put("challengeId", c.getId());
        o.put("status", c.getStatus().name());
        o.put("type", c.getType().name());
        return o;
    }
}
