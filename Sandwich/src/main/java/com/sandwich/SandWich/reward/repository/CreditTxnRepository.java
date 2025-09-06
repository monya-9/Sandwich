package com.sandwich.SandWich.reward.repository;

import com.sandwich.SandWich.reward.domain.CreditTxn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditTxnRepository extends JpaRepository<CreditTxn, Long> {
    List<CreditTxn> findByUserIdAndReasonAndRefId(Long userId, String reason, Long refId);
}
