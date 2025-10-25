package com.sandwich.SandWich.grader.repository;


import com.sandwich.SandWich.grader.domain.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    Optional<TestResult> findBySubmissionId(Long submissionId);
    @Modifying(flushAutomatically = true)
    @Transactional
    @org.springframework.data.jpa.repository.Query(value = """
INSERT INTO test_result
  (submission_id, passed, failed, coverage, logs_url, ai_comment, score_detail_json, total_score,
   created_at, updated_at)
VALUES
  (:sid, :passed, :failed, :coverage, :logsUrl, :aiComment, CAST(:scoreJson AS jsonb), :total,
   NOW(), NOW())
ON CONFLICT (submission_id) DO UPDATE SET
  passed = EXCLUDED.passed,
  failed = EXCLUDED.failed,
  coverage = EXCLUDED.coverage,
  logs_url = EXCLUDED.logs_url,
  ai_comment = EXCLUDED.ai_comment,
  score_detail_json = EXCLUDED.score_detail_json,
  total_score = EXCLUDED.total_score,
  updated_at = NOW()
""", nativeQuery = true)
    int upsert(@Param("sid") Long submissionId,
               @Param("passed") Integer passed,
               @Param("failed") Integer failed,
               @Param("coverage") java.math.BigDecimal coverage,
               @Param("logsUrl") String logsUrl,
               @Param("aiComment") String aiComment,
               @Param("scoreJson") String scoreDetailJson,
               @Param("total") java.math.BigDecimal totalScore);

    @Modifying
    @Transactional
    @org.springframework.data.jpa.repository.Query(
            "delete from TestResult t where t.submissionId in :ids"
    )
    void deleteBySubmissionIdIn(@Param("ids") java.util.Collection<Long> ids);
}