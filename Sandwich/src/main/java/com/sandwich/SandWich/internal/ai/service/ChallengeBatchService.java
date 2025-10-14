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

        int ok = 0;
        for (var it : req.getItems()) {
            ChallengeType type = it.getType();

            // 기간 계산
            OffsetDateTime start;
            OffsetDateTime end;
            OffsetDateTime voteStart = null;
            OffsetDateTime voteEnd   = null;

            if (type == ChallengeType.PORTFOLIO) {
                // month 기반 자동 기간 & 투표기간
                var w = calcMonthWindow(req.getMonth());
                start = w.start();
                end   = w.end();
                voteStart = w.voteStart();
                voteEnd   = w.voteEnd();
            } else if (type == ChallengeType.CODE) {
                // CODE는 start/end 필수
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

            upsertChallenge(
                    req.getMonth(),
                    type,
                    it.getTitle(),
                    it.getSummary(),
                    it.getMust(),
                    it.getMd(),
                    start, end,
                    voteStart, voteEnd
            );
            ok++;
        }

        log.info("[AI-BATCH] month={} items={} ok={}", req.getMonth(), req.getItems().size(), ok);
    }

    private void upsertChallenge(
            String month, ChallengeType type, String title,
            String summary, java.util.List<String> must, String md,
            OffsetDateTime start, OffsetDateTime end,
            OffsetDateTime voteStart, OffsetDateTime voteEnd
    ) {
        // rule_json (null-safe)
        ObjectNode rule = om.createObjectNode();
        rule.put("month", month);
        if (summary != null) rule.put("summary", summary); else rule.set("summary", NullNode.getInstance());
        if (md != null)      rule.put("md", md);           else rule.set("md",      NullNode.getInstance());
        rule.set("must", must == null ? om.createArrayNode() : om.valueToTree(must));

        // 자연키로 업서트 (type, title, startAt)
        Optional<Challenge> existing = challenges.findByTypeAndTitleAndStartAt(type, title, start);

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
            challenges.save(c);
            return;
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
        }
        challenges.save(c);
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
