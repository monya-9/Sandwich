package com.sandwich.SandWich.challenge.repository;

import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import java.time.OffsetDateTime;

public interface ChallengeRepository extends JpaRepository<Challenge, Long>,JpaSpecificationExecutor<Challenge> {

    // DRAFT → OPEN (시작 시각 도달)
    @Query("""
      select c from Challenge c
      where c.status = com.sandwich.SandWich.challenge.domain.ChallengeStatus.DRAFT
        and c.startAt <= :now
    """)
    List<Challenge> findDraftsToOpen(@Param("now") OffsetDateTime now);

    // OPEN → VOTING (포트폴리오만, 투표 시작 도달)
    @Query("""
      select c from Challenge c
      where c.type = com.sandwich.SandWich.challenge.domain.ChallengeType.PORTFOLIO
        and c.status = com.sandwich.SandWich.challenge.domain.ChallengeStatus.OPEN
        and c.voteStartAt is not null
        and c.voteStartAt <= :now
    """)
    List<Challenge> findOpensToVoting(@Param("now") OffsetDateTime now);

    // (OPEN|VOTING|DRAFT) → ENDED
    // - 포트폴리오: voteEndAt
    // - 코드: endAt
    @Query("""
      select c from Challenge c
      where c.status <> com.sandwich.SandWich.challenge.domain.ChallengeStatus.ENDED
        and (
          (c.type = com.sandwich.SandWich.challenge.domain.ChallengeType.PORTFOLIO
             and c.voteEndAt is not null and c.voteEndAt <= :now)
          or
          (c.type = com.sandwich.SandWich.challenge.domain.ChallengeType.CODE
             and c.endAt <= :now)
        )
    """)
    List<Challenge> findToEnd(@Param("now") OffsetDateTime now);

    // 상태 CAS: 예상 상태일 때만 전환 (다중 인스턴스 동시성 방어)
    @Modifying
    @Query("""
      update Challenge c set c.status = :next
      where c.id = :id and c.status = :curr
    """)
    int advanceStatus(@Param("id") Long id,
                      @Param("curr") ChallengeStatus current,
                      @Param("next") ChallengeStatus next);

    Optional<Challenge> findByTypeAndTitleAndStartAt(
            ChallengeType type, String title, OffsetDateTime startAt
    );
}