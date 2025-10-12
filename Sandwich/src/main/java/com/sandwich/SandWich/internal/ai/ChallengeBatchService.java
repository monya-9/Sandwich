package com.sandwich.SandWich.internal.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeBatchService {

    private final RedisUtil redis;                // 멱등키용
    private final ChallengeRepository challenges; // 업서트 타겟
    private final ObjectMapper om = new ObjectMapper();

    private static final Pattern YM = Pattern.compile("^\\d{4}-\\d{2}$");

    @Transactional
    public void ingest(BatchReq req, String idemKey) {
        // 1) 멱등키
        if (idemKey != null && !idemKey.isBlank()) {
            String cacheKey = "idem:ai-batch:" + idemKey;
            if (Boolean.TRUE.equals(redis.hasKey(cacheKey))) {
                throw new ConflictException("IDEMPOTENT_REPLAY", "이미 처리된 요청입니다.");
            }
            redis.setDuplicateTTLKey(cacheKey, 5, java.util.concurrent.TimeUnit.MINUTES);
        }

        // 2) 입력 검증
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BadRequestException("EMPTY_ITEMS", "items가 비어있습니다.");
        }
        if (req.getMonth() == null || !YM.matcher(req.getMonth()).matches()) {
            throw new BadRequestException("BAD_YM", "month는 YYYY-MM 형식이어야 합니다.");
        }

        // 3) 각 아이템 업서트
        int ok = 0;
        for (var it : req.getItems()) {
            // parse
            OffsetDateTime start, end;
            try {
                start = OffsetDateTime.parse(it.getStartAt());
                end   = OffsetDateTime.parse(it.getEndAt());
            } catch (DateTimeParseException e) {
                throw new BadRequestException("BAD_DATETIME", "startAt/endAt는 ISO8601 이어야 합니다.");
            }
            if (!start.isBefore(end)) {
                throw new BadRequestException("BAD_RANGE", "startAt < endAt 이어야 합니다.");
            }

            // 타입 매핑
            ChallengeType type;
            try {
                type = ChallengeType.valueOf(it.getType().trim().toUpperCase());
            } catch (Exception e) {
                throw new BadRequestException("BAD_TYPE", "지원하지 않는 type: " + it.getType());
            }

            upsertChallenge(req.getMonth(), type, it.getTitle(), it.getSummary(), it.getMust(), it.getMd(), start, end);
            ok++;
        }

        log.info("[AI-BATCH] month={} items={} ok={}", req.getMonth(), req.getItems().size(), ok);
    }

    private void upsertChallenge(
            String month, ChallengeType type, String title,
            String summary, java.util.List<String> must, String md,
            java.time.OffsetDateTime startFromReq, java.time.OffsetDateTime endFromReq
    ) {
        // rule_json 구성
        var rule = om.createObjectNode();
        rule.put("month", month);
        if (summary != null) rule.put("summary", summary);
        if (md != null)      rule.put("md", md);
        if (must != null)    rule.set("must", om.valueToTree(must));

        java.time.OffsetDateTime start;
        java.time.OffsetDateTime end;
        java.time.OffsetDateTime voteStart = null;
        java.time.OffsetDateTime voteEnd   = null;

        if (type == ChallengeType.PORTFOLIO) {
            // 포트폴리오: 항상 "해당 월 1일~말일", 투표는 "다음달 1~3일"로 강제 정규화
            var w = calcMonthWindow(month);
            start = w.start();
            end   = w.end();
            voteStart = w.voteStart();
            voteEnd   = w.voteEnd();
        } else {
            // 코드: 주차 기준 등으로 start/end를 외부에서 넘겨받되, 투표는 사용하지 않으므로 null 유지
            start = startFromReq;
            end   = endFromReq;
        }

        // 자연키 (type, title, start_at)로 업서트
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
            java.time.OffsetDateTime start,
            java.time.OffsetDateTime end,
            java.time.OffsetDateTime voteStart,
            java.time.OffsetDateTime voteEnd
    ) {}

    private MonthWindow calcMonthWindow(String ym) {
        // ym: "YYYY-MM"
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
