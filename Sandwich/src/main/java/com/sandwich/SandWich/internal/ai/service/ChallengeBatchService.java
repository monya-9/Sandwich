package com.sandwich.SandWich.internal.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import com.sandwich.SandWich.common.exception.exceptiontype.ConflictException;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.internal.ai.dto.BatchDtos.BatchReq;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLog;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLogRepository;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeBatchService {

    private final RedisUtil redis;
    private final ChallengeRepository challenges;
    private final ObjectMapper om; // 빈 주입 권장 (JavaTimeModule 포함 설정)
    private final ChallengeSyncLogRepository logs;
    private static final Pattern YM = Pattern.compile("^\\d{4}-\\d{2}$");

    @Transactional
    public void ingest(BatchReq req, String idemKey) {
        // 멱등키
        if (idemKey != null && !idemKey.isBlank()) {
            String cacheKey = "idem:ai-batch:" + idemKey;
            if (Boolean.TRUE.equals(redis.hasKey(cacheKey))) {
                throw new ConflictException("IDEMPOTENT_REPLAY", "이미 처리된 요청입니다.");
            }
            redis.setDuplicateTTLKey(cacheKey, 5, TimeUnit.MINUTES);
        }

        // 입력 검증
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BadRequestException("EMPTY_ITEMS", "items가 비어있습니다.");
        }
        if (req.getMonth() == null || !YM.matcher(req.getMonth()).matches()) {
            throw new BadRequestException("BAD_YM", "month는 YYYY-MM 형식이어야 합니다.");
        }

        int created = 0, updated = 0, skipped = 0, failed = 0;

        // ✅ 단일 루프에서 기간 계산 → 업서트 → 집계
        for (var it : req.getItems()) {
            try {
                ChallengeType type = it.getType();

                OffsetDateTime start;
                OffsetDateTime end;
                OffsetDateTime voteStart = null;
                OffsetDateTime voteEnd   = null;

                if (type == ChallengeType.PORTFOLIO) {
                    var w = calcMonthWindow(req.getMonth());
                    start = w.start();
                    end   = w.end();
                    voteStart = w.voteStart();
                    voteEnd   = w.voteEnd();
                } else if (type == ChallengeType.CODE) {
                    if (it.getStartAt() == null || it.getEndAt() == null) {
                        throw new BadRequestException("CODE_NEEDS_DATES", "CODE 항목은 startAt/endAt가 필요합니다.");
                    }
                    try {
                        start = OffsetDateTime.parse(it.getStartAt());
                        end   = OffsetDateTime.parse(it.getEndAt());
                    } catch (DateTimeParseException e) {
                        throw new BadRequestException("BAD_DATETIME", "startAt/endAt는 ISO8601 이어야 합니다.");
                    }
                    if (!start.isBefore(end)) {
                        throw new BadRequestException("BAD_RANGE", "startAt < endAt 이어야 합니다.");
                    }
                } else {
                    throw new BadRequestException("BAD_TYPE", "지원하지 않는 type: " + type);
                }

                boolean isCreated = upsertChallenge(
                        req.getMonth(),
                        type,
                        it.getTitle(),
                        it.getSummary(),
                        it.getMust(),
                        it.getMd(),
                        start, end,
                        voteStart, voteEnd
                );
                if (isCreated) created++; else updated++;

            } catch (Exception e) {
                failed++;
                log.warn("[AI-BATCH] item ingest failed: {}", e.getMessage(), e);
            }
        }

        var oreq = om.valueToTree(req);
        var ores = om.createObjectNode()
                .put("created", created).put("updated", updated)
                .put("skipped", skipped).put("failed", failed);

        logs.save(ChallengeSyncLog.builder()
                .actorType("MACHINE").actorId(null)
                .method("BATCH")
                .aiMonth(req.getMonth())
                .idempotencyKey(idemKey)
                .requestJson(oreq).resultJson(ores)
                .status(failed > 0 ? ((updated > 0 || created > 0) ? "PARTIAL" : "FAILED") : "SUCCESS")
                .message(null)
                .createdCount(created).updatedCount(updated).skippedCount(skipped).errorCount(failed)
                .build());

        log.info("[AI-BATCH] month={} items={} created:{} updated:{} failed:{}",
                req.getMonth(), req.getItems().size(), created, updated, failed);
    }
    private boolean upsertChallenge(
            String month, ChallengeType type, String title,
            String summary, java.util.List<String> must, String md,
            OffsetDateTime start, OffsetDateTime end,
            OffsetDateTime voteStart, OffsetDateTime voteEnd
    ) {
        ObjectNode rule = om.createObjectNode();
        rule.put("month", month);
        if (summary != null) rule.put("summary", summary); else rule.set("summary", NullNode.getInstance());
        if (md != null)      rule.put("md", md);           else rule.set("md",      NullNode.getInstance());
        rule.set("must", must == null ? om.createArrayNode() : om.valueToTree(must));

        var existing = challenges.findByTypeAndTitleAndStartAt(type, title, start);

        if (existing.isPresent()) {
            var c = existing.get();
            c.setEndAt(end);
            c.setRuleJson(rule);
            if (type == ChallengeType.PORTFOLIO) {
                c.setVoteStartAt(voteStart);
                c.setVoteEndAt(voteEnd);
            } else {
                c.setVoteStartAt(null);
                c.setVoteEndAt(null);
            }
            c.setSource("AI_BATCH");
            c.setAiMonth(month);
            c.setAiWeek(null); // 배치 포맷엔 주차 없음
            challenges.save(c);
            return false; // updated
        }

        var c = Challenge.builder()
                .type(type)
                .title(title)
                .ruleJson(rule)
                .startAt(start)
                .endAt(end)
                .status(ChallengeStatus.DRAFT)
                .build();

        if (type == ChallengeType.PORTFOLIO) {
            c.setVoteStartAt(voteStart);
            c.setVoteEndAt(voteEnd);
        } else {
            c.setVoteStartAt(null);
            c.setVoteEndAt(null);
        }
        c.setSource("AI_BATCH");
        c.setAiMonth(month);
        c.setAiWeek(null);

        challenges.save(c);
        return true;
    }

    private static record MonthWindow(
            OffsetDateTime start,
            OffsetDateTime end,
            OffsetDateTime voteStart,
            OffsetDateTime voteEnd
    ) {}

    private MonthWindow calcMonthWindow(String ym) {
        var zone = java.time.ZoneId.of("Asia/Seoul");
        var parts = ym.split("-");
        int y = Integer.parseInt(parts[0]);
        int m = Integer.parseInt(parts[1]);

        var first = java.time.LocalDate.of(y, m, 1);
        var last  = first.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        var start = first.atTime(0,0,0).atZone(zone).toOffsetDateTime();
        var end   = last.atTime(23,59,59).atZone(zone).toOffsetDateTime();

        var nextFirst = first.plusMonths(1);
        var voteStart = nextFirst.atTime(0,0,0).atZone(zone).toOffsetDateTime();
        var voteEnd   = nextFirst.plusDays(2).atTime(23,59,59).atZone(zone).toOffsetDateTime(); // 1~3일

        return new MonthWindow(start, end, voteStart, voteEnd);
    }
}
