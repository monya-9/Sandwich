package com.sandwich.SandWich.challenge.repository;


import com.sandwich.SandWich.challenge.domain.SubmissionAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface SubmissionAssetRepository extends JpaRepository<SubmissionAsset, Long> {

    // 페이지에 올라온 제출물 id들만 한 번에 긁어오고, id 오름차순으로 정렬
    List<SubmissionAsset> findBySubmission_IdInOrderByIdAsc(Collection<Long> submissionIds);
    void deleteBySubmission_IdIn(Collection<Long> submissionIds);
    @Query("select a.submission.id as id, count(a.id) as cnt " +
            "from SubmissionAsset a where a.submission.id in :ids group by a.submission.id")
    List<com.sandwich.SandWich.admin.service.AdminChallengeQueryService.CountRowInt>
    countBySubmissionIds(@Param("ids") List<Long> submissionIds);
}