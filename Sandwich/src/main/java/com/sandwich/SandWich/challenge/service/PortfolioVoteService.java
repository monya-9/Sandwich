package com.sandwich.SandWich.challenge.service;


import com.sandwich.SandWich.auth.CurrentUserProvider;
import com.sandwich.SandWich.challenge.domain.*;
import com.sandwich.SandWich.challenge.dto.VoteDtos;
import com.sandwich.SandWich.challenge.repository.*;
import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import com.sandwich.SandWich.common.exception.exceptiontype.ConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class PortfolioVoteService {

    private final ChallengeRepository challengeRepo;
    private final SubmissionRepository submissionRepo;
    private final PortfolioVoteRepository voteRepo;
    private final CurrentUserProvider currentUser;
    private final PortfolioLeaderboardCache leaderboardCache;

    // ===== 에러 코드 상수 (오타 방지)
    private static final String ERR_DUP_VOTE          = "DUPLICATE_VOTE";
    private static final String ERR_SELF_VOTE         = "SELF_VOTE_NOT_ALLOWED";
    private static final String ERR_VOTING_CLOSED     = "VOTING_CLOSED";
    private static final String ERR_ONLY_PORTFOLIO    = "ONLY_PORTFOLIO";
    private static final String ERR_SUB_MISMATCH      = "SUBMISSION_MISMATCH";
    private static final String ERR_CH_NOT_FOUND      = "CHALLENGE_NOT_FOUND";
    private static final String ERR_SUB_NOT_FOUND     = "SUBMISSION_NOT_FOUND";
    private static final String ERR_VOTE_NOT_FOUND    = "VOTE_NOT_FOUND";
    private static final String ERR_LOGIN_REQUIRED    = "LOGIN_REQUIRED";


    @Transactional
    public Long create(Long challengeId, VoteDtos.CreateOrUpdateReq req) {
        var ctx = loadAndValidate(challengeId, req.getSubmissionId());
        Long voterId = current();

        if (voteRepo.existsByChallenge_IdAndVoterId(challengeId, voterId)) {
            throw new ConflictException(ERR_DUP_VOTE, "이미 해당 챌린지에 투표했습니다.");
        }

        if (ctx.submission().getOwnerId().equals(voterId)) {
            throw new BadRequestException(ERR_SELF_VOTE, "자기 작품에는 투표할 수 없습니다.");
        }

        var v = PortfolioVote.builder()
                .challenge(ctx.challenge())
                .submission(ctx.submission())
                .voterId(voterId)
                .uiUx(req.getUiUx())
                .creativity(req.getCreativity())
                .codeQuality(req.getCodeQuality())
                .difficulty(req.getDifficulty())
                .build();

        var saved = voteRepo.save(v);

        // 리더보드 증분 반영 (+1 표)
        try {
            leaderboardCache.applyDelta(
                    challengeId, ctx.submission().getId(),
                    req.getUiUx(), req.getCreativity(), req.getCodeQuality(), req.getDifficulty(),
                    +1
            );
        } catch (Exception ignore) { /* 캐시 실패는 본 로직 영향 X */ }

        return saved.getId();
    }

    @Transactional
    public void updateMy(Long challengeId, VoteDtos.CreateOrUpdateReq req) {
        var ctx = loadAndValidate(challengeId, req.getSubmissionId());
        Long voterId = current();

        var v = voteRepo.findByChallenge_IdAndVoterId(challengeId, voterId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Vote not found"));

        if (ctx.submission().getOwnerId().equals(voterId)) {
            throw new BadRequestException(ERR_SELF_VOTE, "자기 작품에는 투표할 수 없습니다.");
        }

        // 증분 계산을 위해 기존 값 백업
        int ou = v.getUiUx(), oc = v.getCreativity(), oq = v.getCodeQuality(), od = v.getDifficulty();
        Long oldSubId = v.getSubmission().getId();

        v.setSubmission(ctx.submission());
        v.setUiUx(req.getUiUx());
        v.setCreativity(req.getCreativity());
        v.setCodeQuality(req.getCodeQuality());
        v.setDifficulty(req.getDifficulty());

        // 리더보드 증분 반영
        try {
            if (oldSubId.equals(ctx.submission().getId())) {
                // 같은 제출물에서 점수만 바뀜 → 차이만 반영, 표 수 변화 0
                leaderboardCache.applyDelta(
                        challengeId, oldSubId,
                        req.getUiUx() - ou,
                        req.getCreativity() - oc,
                        req.getCodeQuality() - oq,
                        req.getDifficulty() - od,
                        0
                );
            } else {
                // 제출물 변경 → 이전 -1, 새 +1
                leaderboardCache.applyDelta(
                        challengeId, oldSubId, -ou, -oc, -oq, -od, -1
                );
                leaderboardCache.applyDelta(
                        challengeId, ctx.submission().getId(),
                        req.getUiUx(), req.getCreativity(), req.getCodeQuality(), req.getDifficulty(),
                        +1
                );
            }
        } catch (Exception ignore) { /* 캐시 실패는 본 로직 영향 X */ }

    }

    @Transactional(readOnly = true)
    public VoteDtos.MyVoteResp myVote(Long challengeId) {
        Long voterId = current();
        var v = voteRepo.findByChallenge_IdAndVoterId(challengeId, voterId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, ERR_VOTE_NOT_FOUND));
        return VoteDtos.MyVoteResp.from(v);
    }

    @Transactional(readOnly = true)
    public List<VoteDtos.SummaryItem> summary(Long challengeId) {
        return voteRepo.summarize(challengeId).stream().map(VoteDtos.SummaryItem::from).toList();
    }

    // ===== helpers =====
    private record Ctx(Challenge challenge, Submission submission) {}

    private Ctx loadAndValidate(Long challengeId, Long submissionId) {
        var ch = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, ERR_CH_NOT_FOUND));

        if (ch.getType() != ChallengeType.PORTFOLIO) {
            throw new BadRequestException(ERR_ONLY_PORTFOLIO, "포트폴리오 챌린지에서만 투표할 수 있습니다.");
        }

        var now = OffsetDateTime.now();
        if (ch.getVoteStartAt() == null || ch.getVoteEndAt() == null
                || now.isBefore(ch.getVoteStartAt())
                || now.isAfter(ch.getVoteEndAt())) {
            throw new BadRequestException(ERR_VOTING_CLOSED, "투표 기간이 아닙니다.");
        }

        var sub = submissionRepo.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, ERR_SUB_NOT_FOUND));

        if (!sub.getChallenge().getId().equals(challengeId)) {
            throw new BadRequestException(ERR_SUB_MISMATCH, "해당 챌린지의 제출물이 아닙니다.");
        }

        return new Ctx(ch, sub);
    }

    private Long current() {
        try { return currentUser.currentUserId(); }
        catch (Exception e) { throw new ResponseStatusException(UNAUTHORIZED, ERR_LOGIN_REQUIRED); }
    }
}