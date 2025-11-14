package com.sandwich.SandWich.admin.controller;

import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.CreateReq;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.PatchReq;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.PublishReq;
import com.sandwich.SandWich.admin.service.AdminChallengeQueryService;
import com.sandwich.SandWich.admin.service.AdminChallengeService;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.repository.PortfolioVoteRepository;
import com.sandwich.SandWich.reward.service.RewardRule;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;              // ✅ 추가
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/challenges")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminChallengeController {

    private final AdminChallengeService service;           // 생성/패치/발표/리더보드
    private final AdminChallengeQueryService queryService; // 목록/개요/제출/요약
    private final ChallengeRepository challengeRepo;       // 개요용 단건 조회
    private final PortfolioVoteRepository voteRepo;        // 요약 네이티브
    private final SubmissionRepository submissionRepo;

    public record IdResp(Long id) {}

    @PostMapping
    public IdResp create(@RequestBody @Valid CreateReq req) {
        return new IdResp(service.create(req));
    }

    @PatchMapping("/{id}")
    public Map<String,Object> patch(@PathVariable Long id, @RequestBody @Valid PatchReq req) {
        service.patch(id, req);
        return Map.of("ok", true);
    }

    @GetMapping("/{id}")
    public AdminChallengeDtos.Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PatchMapping("/{id}/status")
    public Map<String,Object> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body) {
        var next = ChallengeStatus.valueOf(body.get("status"));
        service.updateStatusAndPublish(id, next);
        return Map.of("ok", true);
    }

    @DeleteMapping("/{id}")
    public Map<String,Object> delete(@PathVariable Long id,
                                     @RequestParam(defaultValue = "false") boolean force) {
        service.delete(id, force);   // ← 실제 삭제
        return Map.of("ok", true);
    }

    @GetMapping
    public Page<AdminChallengeDtos.ListItem> list(
            @RequestParam(required=false) String q,
            @RequestParam(required=false) ChallengeType type,
            @RequestParam(required=false) ChallengeStatus status,
            @RequestParam(required=false) OffsetDateTime from,
            @RequestParam(required=false) OffsetDateTime to,
            @RequestParam(required=false) String source,
            @RequestParam(required=false) String aiMonth,
            @RequestParam(required=false) String aiWeek,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,
            @RequestParam(required=false, defaultValue="-startAt") String sort
    ) {
        Sort.Direction dir = sort.startsWith("-") ? Sort.Direction.DESC : Sort.Direction.ASC;
        String prop = sort.replaceFirst("^[+-]", "");
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, prop));
        return queryService.searchChallenges(q, type, status, from, to, source, aiMonth, aiWeek, pageable);
    }

    @PostMapping("/{id}/publish-results")
    public Map<String,Object> publish(@PathVariable Long id, @RequestBody PublishReq req) {
        var rule = new RewardRule(
                req.top() == null ? java.util.List.of() : req.top(),
                req.participant()
        );
        int inserted = service.publishResults(id, rule);
        return Map.of("inserted", inserted);
    }

    @PostMapping("/{id}/publish-results/default")
    public Map<String,Object> publishDefault(@PathVariable Long id) {
        var rule = new RewardRule(java.util.List.of(10000L, 5000L, 3000L), 500L);
        int inserted = service.publishResults(id, rule);
        return Map.of("inserted", inserted);
    }



    @PostMapping("/{id}/rebuild-leaderboard")
    public Map<String,Object> rebuild(@PathVariable Long id) {
        service.rebuildLeaderboard(id);
        return Map.of("result", "ok");
    }

    // ===== 조회: 투표 요약 =====
    @GetMapping("/{id}/votes/summary")
    public java.util.List<AdminChallengeDtos.VoteSummaryItem> votesSummary(@PathVariable Long id) {
        return voteRepo.summarize(id).stream().map(r ->
                AdminChallengeDtos.VoteSummaryItem.builder()
                        .submissionId(r.getSubmissionId())
                        .voteCount(r.getVoteCount())
                        .uiUxAvg(n(r.getUiUxAvg()))
                        .creativityAvg(n(r.getCreativityAvg()))
                        .codeQualityAvg(n(r.getCodeQualityAvg()))
                        .difficultyAvg(n(r.getDifficultyAvg()))
                        .totalScore(n(r.getTotalScore()))
                        .build()
        ).collect(Collectors.toList());
    }

    @GetMapping("/{id}/overview")
    public AdminChallengeDtos.Overview overview(@PathVariable Long id) {
        var c = challengeRepo.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Challenge not found"));

        long subCnt = submissionRepo.countByChallenge_Id(id);
        long voteCnt = voteRepo.countByChallengeIds(List.of(id))
                .stream().findFirst().map(r -> r.getCnt()).orElse(0L);

        return AdminChallengeDtos.Overview.builder()
                .id(c.getId())
                .type(c.getType())
                .title(c.getTitle())
                .status(c.getStatus())
                .startAt(c.getStartAt())
                .endAt(c.getEndAt())
                .voteStartAt(c.getVoteStartAt())
                .voteEndAt(c.getVoteEndAt())
                .ruleJson(c.getRuleJson() == null ? "{}" : c.getRuleJson().toString())
                .submissionCount(subCnt)
                .voteCount(voteCnt)
                .selectedIdx(c.getSelectedIdx())
                .build();
    }

    // ===== 조회: 제출 목록(관리 뷰) =====
    @GetMapping("/{id}/submissions")
    public Page<AdminChallengeDtos.SubmissionItem> submissions(
            @PathVariable Long id,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "-createdAt") String sort
    ) {
        Sort.Direction dir = (sort != null && sort.startsWith("-"))
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String prop = (sort == null || sort.isBlank())
                ? "createdAt" : sort.replaceFirst("^[+-]", "");
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, prop));
        return queryService.listSubmissions(id, q, ownerId, pageable);
    }

    // ===== 제출 목록 CSV (엑셀 호환/BOM + 파일명 지정) =====
    @GetMapping(value="/{id}/submissions.csv", produces="text/csv")
    public ResponseEntity<byte[]> exportSubmissionsCsv2(
            @PathVariable Long id,
            @RequestParam(required=false) String q,
            @RequestParam(required=false) Long ownerId
    ) {
        // 기존 submissions(...)가 없으므로 queryService를 직접 호출
        var all = queryService.listSubmissions(id, q, ownerId,
                        org.springframework.data.domain.PageRequest.of(0, 1000,
                                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")))
                .getContent();

        String header = "id,ownerId,title,repoUrl,demoUrl,status,assetCount,totalScore,createdAt\n";
        String body = all.stream().map(it ->
                String.format("%d,%d,%s,%s,%s,%s,%d,%s,%s",
                        it.getId(), it.getOwnerId(),
                        csv(it.getTitle()),
                        csv(it.getRepoUrl()), csv(it.getDemoUrl()),
                        csv(it.getStatus()), it.getAssetCount(),
                        it.getTotalScore()==null? "" : it.getTotalScore().toPlainString(),
                        it.getCreatedAt())
        ).collect(Collectors.joining("\n"));

        // UTF-8 BOM (Excel 한글 깨짐 방지)
        byte[] bom = new byte[]{(byte)0xEF, (byte)0xBB, (byte)0xBF};
        byte[] bytes = (header + body + "\n").getBytes(StandardCharsets.UTF_8);
        byte[] withBom = new byte[bom.length + bytes.length];
        System.arraycopy(bom, 0, withBom, 0, bom.length);
        System.arraycopy(bytes, 0, withBom, bom.length, bytes.length);

        String filename = "submissions-" + id + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(withBom);
    }

    // ===== 투표 요약 CSV =====
    @GetMapping(value="/{id}/votes.csv", produces="text/csv; charset=UTF-8")
    public @ResponseBody byte[] exportVotesCsv(@PathVariable Long id) {
        var rows = votesSummary(id);
        String header = "submissionId,voteCount,uiUxAvg,creativityAvg,codeQualityAvg,difficultyAvg,totalScore\n";
        String body = rows.stream().map(it ->
                String.format("%d,%d,%.2f,%.2f,%.2f,%.2f,%.2f",
                        it.getSubmissionId(), it.getVoteCount(),
                        it.getUiUxAvg(), it.getCreativityAvg(),
                        it.getCodeQualityAvg(), it.getDifficultyAvg(),
                        it.getTotalScore())
        ).collect(Collectors.joining("\n"));
        return (header + body + "\n").getBytes(StandardCharsets.UTF_8);
    }

    /* ===== helpers ===== */
    private static double n(Double d){ return d==null?0.0:d; }

    private static String csv(String s) {
        if (s == null) return "";
        String v = s.replace("\"","\"\"");
        if (v.contains(",") || v.contains("\n")) return "\"" + v + "\"";
        return v;
    }
}
