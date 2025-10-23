package com.sandwich.SandWich.reward.repository;

import com.sandwich.SandWich.reward.domain.RewardPayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardPayoutRepository extends JpaRepository<RewardPayout, Long> {
    Optional<RewardPayout> findByChallengeIdAndUserId(Long challengeId, Long userId);
    List<RewardPayout> findByChallengeId(Long challengeId);

    boolean existsByChallengeId(Long challengeId);

    long countByChallengeId(Long challengeId);
}