package com.sandwich.SandWich.challenge.repository;


import com.sandwich.SandWich.challenge.domain.SubmissionAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SubmissionAssetRepository extends JpaRepository<SubmissionAsset, Long> {

    // 페이지에 올라온 제출물 id들만 한 번에 긁어오고, id 오름차순으로 정렬
    List<SubmissionAsset> findBySubmission_IdInOrderByIdAsc(Collection<Long> submissionIds);

}