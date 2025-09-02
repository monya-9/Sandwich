package com.sandwich.SandWich.search.service;


import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.search.domain.RecentSearch;
import com.sandwich.SandWich.search.domain.RecentSearchType;
import com.sandwich.SandWich.search.dto.RecentSearchItem;
import com.sandwich.SandWich.search.dto.RecentSearchRequest;
import com.sandwich.SandWich.search.repository.RecentSearchRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecentSearchService {

    private static final int MAX_RECENTS = 20; // 유저당 최대 저장

    private final RecentSearchRepository repo;

    @Transactional
    public RecentSearchItem add(User user, RecentSearchRequest req) {
        String trimmed = req.keyword().trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("keyword must not be blank");
        }
        var existing = repo.findFirstByUser_IdAndTypeAndKeywordIgnoreCase(user.getId(), req.type(), trimmed);
        RecentSearch saved;
        if (existing.isPresent()) {
            // 같은 키워드 → 최신화
            var rs = existing.get();
            rs.touchKeyword(trimmed); // updatedAt 갱신
            saved = rs;
        } else {
            saved = RecentSearch.builder()
                    .user(user)
                    .type(req.type())
                    .keyword(trimmed)
                    .build();
            repo.save(saved);
        }

        // 용량 초과 시 오래된 것 제거
        long count = repo.countByUser_Id(user.getId());
        if (count > MAX_RECENTS) {
            int over = (int) (count - MAX_RECENTS);
            var oldOnes = repo.findByUser_IdOrderByUpdatedAtAsc(user.getId(), PageRequest.of(0, over));
            repo.deleteAllInBatch(oldOnes);
        }

        return toItem(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<RecentSearchItem> list(User user, Integer limit, RecentSearchType type) {
        int size = (limit == null || limit <= 0 || limit > MAX_RECENTS) ? MAX_RECENTS : limit;
        List<RecentSearch> rows = (type == null)
                ? repo.findByUser_IdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, size))
                : repo.findByUser_IdAndTypeOrderByUpdatedAtDesc(user.getId(), type, PageRequest.of(0, size));

        List<RecentSearchItem> mapped = rows.stream().map(this::toItem).toList();
        // PageResponse 모양 맞추기(고정 크기 리스트라 PageImpl 사용)
        Page<RecentSearchItem> page = new PageImpl<>(mapped, PageRequest.of(0, size), mapped.size());
        return PageResponse.of(page);
    }

    @Transactional
    public void deleteOne(User user, Long id) {
        repo.findById(id)
                .filter(rs -> rs.getUser().getId().equals(user.getId()))
                .ifPresentOrElse(repo::delete, () -> { /* 없는 건 무시 */ });
    }

    @Transactional
    public void deleteAll(User user, RecentSearchType type) {
        // 타입 지정 시 해당 타입만, 아니면 전부 삭제
        List<RecentSearch> rows = (type == null)
                ? repo.findByUser_IdOrderByUpdatedAtDesc(user.getId(), PageRequest.of(0, MAX_RECENTS))
                : repo.findByUser_IdAndTypeOrderByUpdatedAtDesc(user.getId(), type, PageRequest.of(0, MAX_RECENTS));
        repo.deleteAllInBatch(rows);
    }

    private RecentSearchItem toItem(RecentSearch r) {
        return new RecentSearchItem(r.getId(), r.getKeyword(), r.getType(), r.getUpdatedAt());
    }
}