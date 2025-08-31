package com.sandwich.SandWich.search.repository;

import com.sandwich.SandWich.search.domain.RecentSearch;
import com.sandwich.SandWich.search.domain.RecentSearchType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecentSearchRepository extends JpaRepository<RecentSearch, Long> {
    // 대소문자 무시 중복 체크
    Optional<RecentSearch> findFirstByUser_IdAndTypeAndKeywordIgnoreCase(Long userId, RecentSearchType type, String keyword);

    // 리스트(최신순)
    List<RecentSearch> findByUser_IdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    List<RecentSearch> findByUser_IdAndTypeOrderByUpdatedAtDesc(Long userId, RecentSearchType type, Pageable pageable);

    long countByUser_Id(Long userId);

    // 오래된 것 정리
    List<RecentSearch> findByUser_IdOrderByUpdatedAtAsc(Long userId, Pageable pageable);
}