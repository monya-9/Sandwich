package com.sandwich.SandWich.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.CreateReq;
import com.sandwich.SandWich.admin.dto.AdminChallengeDtos.PatchReq;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import com.sandwich.SandWich.challenge.event.ChallengeLifecycleEvent;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.repository.ChallengeSpecifications;
import com.sandwich.SandWich.challenge.repository.PortfolioVoteRepository;
import com.sandwich.SandWich.challenge.repository.SubmissionRepository;
import com.sandwich.SandWich.challenge.synclog.ChallengeSyncLogRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.BadRequestException;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.reward.service.RewardPayoutService;
import com.sandwich.SandWich.reward.service.RewardRule;
import com.sandwich.SandWich.challenge.service.PortfolioLeaderboardCache;
import com.sandwich.SandWich.auth.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.challenge.repository.*;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.grader.repository.TestResultRepository;


@Service
@RequiredArgsConstructor
public class AdminChallengeService {

    private final ObjectMapper om;
    private final ChallengeRepository repo;
    private final RewardPayoutService reward;
    private final PortfolioLeaderboardCache leaderboard;
    private final CurrentUserProvider current;
    private final com.sandwich.SandWich.admin.store.AdminAuditLogRepository auditRepo;
    private final ChallengeSyncLogRepository logs;
    private final SubmissionRepository submissionRepo;
    private final PortfolioVoteRepository voteRepo;
    private final SubmissionAssetRepository assetRepo;
    private final CodeSubmissionRepository codeRepo;
    private final LikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final TestResultRepository testResultRepo;
    private final RedisUtil redisUtil;
    private final ApplicationEventPublisher publisher;


    @Transactional
    public Long create(CreateReq req) {
        Challenge c = new Challenge();
        c.setType(req.getType());
        c.setTitle(req.getTitle());
        c.setRuleJson(parseRule(req.getRuleJson()));
        c.setStartAt(req.getStartAt());
        c.setEndAt(req.getEndAt());
        c.setVoteStartAt(req.getVoteStartAt());
        c.setVoteEndAt(req.getVoteEndAt());
        c.setStatus(req.getStatus() == null ? ChallengeStatus.DRAFT : req.getStatus());

        validateWindow(c);
        c = repo.save(c);
        audit("CREATE_CHALLENGE", "CHALLENGE", c.getId(), req); // no-op
        return c.getId();
    }



    @Transactional
    public void patch(Long id, PatchReq req) {
        Challenge c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));

        if (req.getType() != null) c.setType(req.getType());
        if (req.getTitle() != null) c.setTitle(req.getTitle());
        if (req.getRuleJson() != null) c.setRuleJson(parseRule(req.getRuleJson()));
        if (req.getStartAt() != null) c.setStartAt(req.getStartAt());
        if (req.getEndAt() != null) c.setEndAt(req.getEndAt());
        if (req.getVoteStartAt() != null) c.setVoteStartAt(req.getVoteStartAt());
        if (req.getVoteEndAt() != null) c.setVoteEndAt(req.getVoteEndAt());
        if (req.getStatus() != null) c.setStatus(req.getStatus());

        validateWindow(c);
        audit("PATCH_CHALLENGE", "CHALLENGE", id, req); // no-op
    }

    @Transactional
    public void rebuildLeaderboard(Long challengeId) {
        if (leaderboard != null) {
            leaderboard.rebuild(challengeId); // 네 구현: void
            audit("REBUILD_LEADERBOARD", "CHALLENGE", challengeId, "rebuilt"); // no-op
        }
    }

    @Transactional
    public int publishResults(Long challengeId, RewardRule rule) {
        int inserted = reward.publishPortfolioResults(challengeId, rule);
        audit("PUBLISH_RESULTS", "CHALLENGE", challengeId, rule); // no-op
        return inserted;
    }

    /** DB CHECK와 동일: start<end && ((vs,ve 둘다 null) || (둘다 not null && end<=vs && vs<ve)) */
    private void validateWindow(Challenge c) {
        var start = c.getStartAt();
        var end   = c.getEndAt();
        var vs    = c.getVoteStartAt();
        var ve    = c.getVoteEndAt();

        boolean base = start != null && end != null && start.isBefore(end);
        boolean noVote = (vs == null && ve == null);
        boolean hasVote = (vs != null && ve != null) && !vs.isBefore(end) && vs.isBefore(ve);

        if (!(base && (noVote || hasVote))) {
            throw new BadRequestException("TIME_WINDOW_INVALID", "시간 파라미터 제약에 맞지 않습니다.");
        }
    }

    private void audit(String action, String targetType, Long targetId, Object payload) {
        if (auditRepo == null) return;
        try {
            Long adminId = current.currentUserId();
            auditRepo.save(com.sandwich.SandWich.admin.store.AdminAuditLog.of(adminId, action, targetType, targetId, payload));
        } catch (Exception ignored) {}
    }

    private JsonNode parseRule(String raw) {
        if (raw == null || raw.isBlank()) {
            return om.createObjectNode(); // 빈 JSON {}
        }
        try {
            return om.readTree(raw);      // 문자열 → JsonNode
        } catch (JsonProcessingException e) {
            // 잘못된 JSON이면 400으로
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RULE_JSON");
        }
    }

    public Page<AdminChallengeDtos.ListItem> list(
            ChallengeType type, ChallengeStatus status, String source,
            String aiMonth, String aiWeek, Pageable pageable) {

        Specification<Challenge> spec = Specification
                .where(ChallengeSpecifications.hasType(type))
                .and(ChallengeSpecifications.hasStatus(status))
                .and((root,q,cb) -> source==null? null : cb.equal(root.get("source"), source))
                .and((root,q,cb) -> aiMonth==null? null : cb.equal(root.get("aiMonth"), aiMonth))
                .and((root,q,cb) -> aiWeek==null? null : cb.equal(root.get("aiWeek"), aiWeek));

        return repo.findAll(spec, pageable).map(AdminChallengeDtos.ListItem::from);
    }

    public AdminChallengeDtos.Detail get(Long id) {
        Challenge c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // 최신 로그 1건
        var latest = logs.findAll(
                (root,q,cb) -> cb.or(
                        cb.equal(root.get("aiMonth"), c.getAiMonth()),
                        cb.equal(root.get("aiWeek"),  c.getAiWeek())
                ),
                PageRequest.of(0,1, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
        return AdminChallengeDtos.Detail.builder()
                .challenge(AdminChallengeDtos.ListItem.from(c))
                .latestSync(latest.isEmpty()? null : latest.get(0))
                .build();
    }

    @Transactional
    public void delete(Long challengeId, boolean force) {
        Challenge c = repo.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));

        if (reward.isPublished(challengeId) && !force) {
            throw new BadRequestException("CANNOT_DELETE_PUBLISHED",
                    "보상 지급된 챌린지는 삭제할 수 없습니다. force=true로 강제 삭제하세요.");
        }

        long submissionCount = submissionRepo.countByChallenge_Id(challengeId);
        long voteCount = 0L;
        try {
            voteCount = voteRepo.countByChallengeIds(java.util.List.of(challengeId))
                    .stream().findFirst().map(r -> r.getCnt()).orElse(0L);
        } catch (Exception ignore) {}

        if (!force && (submissionCount > 0 || voteCount > 0)) {
            throw new BadRequestException("HAS_DEPENDENCIES",
                    "제출물/투표가 있어 삭제할 수 없습니다. force=true로 강제 삭제하거나 ENDED로 상태 변경하세요.");
        }

        // 1) 뷰카운트 캐시 삭제
        var subIds = submissionRepo.findIdsByChallengeId(challengeId);
        for (Long sid : subIds) {
            redisUtil.deleteValue("viewcount:submission:" + sid);
        }

        // 2) 선삭제: 투표/좋아요/댓글/테스트/코드/에셋
        try { voteRepo.deleteByChallengeId(challengeId); } catch (Exception ignore) {}

        if (!subIds.isEmpty()) {
            var likeType = (c.getType() == ChallengeType.CODE)
                    ? com.sandwich.SandWich.social.domain.LikeTargetType.CODE_SUBMISSION
                    : com.sandwich.SandWich.social.domain.LikeTargetType.PORTFOLIO_SUBMISSION;
            var commentType = (c.getType() == ChallengeType.CODE) ? "CODE_SUBMISSION" : "PORTFOLIO_SUBMISSION";

            try { likeRepo.deleteByTargetTypeAndTargetIdIn(likeType, subIds); } catch (Exception ignore) {}
            try { commentRepo.deleteByCommentableTypeAndCommentableIdIn(commentType, subIds); } catch (Exception ignore) {}
            try { testResultRepo.deleteBySubmissionIdIn(subIds); } catch (Exception ignore) {}
            try { codeRepo.deleteBySubmission_IdIn(subIds); } catch (Exception ignore) {}
            try { assetRepo.deleteBySubmission_IdIn(subIds); } catch (Exception ignore) {}
        }
        // 3) 제출물 일괄 삭제 (JPQL bulk)
        submissionRepo.deleteByChallengeId(challengeId);

        // 4) 마지막에 챌린지 삭제
        repo.delete(c);

        audit("DELETE_CHALLENGE", "CHALLENGE", challengeId, Map.of(
                "force", force, "submissionCount", submissionCount, "voteCount", voteCount
        ));
    }

    @Transactional
    public void updateStatusAndPublish(Long id, ChallengeStatus next) {
        var c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));
        var prev = c.getStatus();
        c.setStatus(next);            // dirty checking으로 flush 예정

        // 트랜잭션 *안에서* 이벤트 발행 → AFTER_COMMIT 리스너가 받는다
        publisher.publishEvent(new ChallengeLifecycleEvent(c.getId(), c.getType(), prev, next));

        audit("PATCH_CHALLENGE_STATUS", "CHALLENGE", id, Map.of("prev", prev, "next", next));
    }


}
