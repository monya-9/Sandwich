package com.sandwich.SandWich.challenge.synclog;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ChallengeSyncLogRepository extends JpaRepository<ChallengeSyncLog, Long>, JpaSpecificationExecutor<ChallengeSyncLog> {}
