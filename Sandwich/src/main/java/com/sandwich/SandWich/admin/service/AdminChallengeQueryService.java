package com.sandwich.SandWich.admin.service;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos;
import com.sandwich.SandWich.admin.store.ChallengeQueryRepository;
import com.sandwich.SandWich.admin.store.SubmissionQueryRepository;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.repository.PortfolioVoteRepository;
import com.sandwich.SandWich.challenge.repository.SubmissionAssetRepository;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.grader.repository.TestResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageImpl;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminChallengeQueryService {
    private final ChallengeQueryRepository challengeQr;
    private final SubmissionQueryRepository submissionQr;


    private final SubmissionRepository submissionRepo;
    private final SubmissionAssetRepository assetRepo;
    private final PortfolioVoteRepository voteRepo;
    private final TestResultRepository testResultRepo;

    @Transactional(readOnly = true)
    public Page<AdminChallengeDtos.ListItem> searchChallenges(
            String q,
            com.sandwich.SandWich.challenge.domain.ChallengeType type,
            com.sandwich.SandWich.challenge.domain.ChallengeStatus status,
            java.time.OffsetDateTime from,
            java.time.OffsetDateTime to,
            Pageable pageable) {
        Page<Challenge> page = challengeQr.search(q, type, status, from, to, pageable);
        var ids = page.getContent().stream().map(Challenge::getId).toList();


        Map<Long, Long> subCnt = countSubmissions(ids);
        Map<Long, Long> voteCnt = countVotes(ids);


        var content = page.getContent().stream().map(c -> AdminChallengeDtos.ListItem.builder()
                        .id(c.getId())
                        .type(c.getType())
                        .title(c.getTitle())
                        .status(c.getStatus())
                        .startAt(c.getStartAt())
                        .endAt(c.getEndAt())
                        .voteStartAt(c.getVoteStartAt())
                        .voteEndAt(c.getVoteEndAt())
                        .submissionCount(subCnt.getOrDefault(c.getId(), 0L))
                        .voteCount(voteCnt.getOrDefault(c.getId(), 0L))
                        .build())
                .toList();


        return new PageImpl<>(content, pageable, page.getTotalElements());
    }
    @Transactional(readOnly = true)
    public AdminChallengeDtos.Overview overview(Long id) {
// 재사용: 단건 조회는 기존 ChallengeRepository를 써도 되지만 의존 줄이려고 QR 사용 안 함
        var page = searchChallenges(null, null, null, null, null, PageRequest.of(0, 1));
// 위는 더미 — 실제 구현에서는 ChallengeRepository.findById(id)를 쓰는 편이 간단
        throw new UnsupportedOperationException("overview(Long) 는 Controller에서 ChallengeRepository.findById 사용으로 대체됨");
    }



    @Transactional(readOnly = true)
    public Page<AdminChallengeDtos.SubmissionItem> listSubmissions(
            Long challengeId, String q, Long ownerId, Pageable pageable) {


        var page = submissionQr.findByChallenge(challengeId, q, ownerId, pageable);
        var subIds = page.getContent().stream().map(s -> s.getId()).toList();


        Map<Long, Integer> assetCount = countAssets(subIds);
        var scoreMap = testResultRepo.findAll().stream()
                .filter(tr -> subIds.contains(tr.getSubmissionId()))
                .collect(Collectors.toMap(
                        tr -> tr.getSubmissionId(),
                        tr -> tr.getTotalScore(),
                        (a,b)->b
                ));

        var content = page.getContent().stream().map(s -> AdminChallengeDtos.SubmissionItem.builder()
                        .id(s.getId())
                        .ownerId(s.getOwnerId())
                        .title(s.getTitle())
                        .repoUrl(s.getRepoUrl())
                        .demoUrl(s.getDemoUrl())
                        .desc(s.getDesc())
                        .status(s.getStatus().name())
                        .assetCount(assetCount.getOrDefault(s.getId(), 0))
                        .totalScore(scoreMap.get(s.getId()))
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();


        return new PageImpl<AdminChallengeDtos.SubmissionItem>(content, pageable, page.getTotalElements());
    }

    /* ===== helpers ===== */
    private Map<Long, Long> countSubmissions(List<Long> challengeIds) {
        if (challengeIds == null || challengeIds.isEmpty()) return Map.of();
        var rows = submissionRepo.countByChallengeIds(challengeIds);
        return rows.stream().collect(Collectors.toMap(CountRow::getChId, CountRow::getCnt));
    }

    private Map<Long, Long> countVotes(List<Long> challengeIds) {
        if (challengeIds == null || challengeIds.isEmpty()) return Map.of();
        var rows = voteRepo.countByChallengeIds(challengeIds);
        return rows.stream().collect(Collectors.toMap(CountRow::getChId, CountRow::getCnt));
    }

    private Map<Long, Integer> countAssets(List<Long> submissionIds) {
        if (submissionIds == null || submissionIds.isEmpty()) return Map.of();
        var rows = assetRepo.countBySubmissionIds(submissionIds);
        return rows.stream().collect(Collectors.toMap(
                CountRowInt::getId,
                r -> Math.toIntExact(r.getCnt())
        ));
    }

    public interface CountRow { Long getChId(); Long getCnt(); }
    public interface CountRowInt { Long getId(); Long getCnt(); }

}
