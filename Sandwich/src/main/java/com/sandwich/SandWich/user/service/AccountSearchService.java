package com.sandwich.SandWich.user.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.dto.AccountSearchItem;
import com.sandwich.SandWich.user.repository.UserAccountRow;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountSearchService {

    private final UserRepository userRepo;
    private final ProjectRepository projectRepo;

    @Transactional(readOnly = true)
    public PageResponse<AccountSearchItem> search(String rawQ, Pageable pageable) {
        String q = rawQ == null ? "" : rawQ.trim();

        Page<UserAccountRow> page = q.isEmpty()
                ? userRepo.findAllAccounts(pageable)
                : userRepo.searchAccounts(q, pageable);

        // 1) 응답에 포함될 사용자 id 목록
        List<Long> userIds = page.getContent().stream()
                .map(UserAccountRow::getId)
                .toList();

        // 2) 사용자별 최신 프로젝트 3개 {id, coverUrl} 조회 (final로 한 번에 초기화)
        final Map<Long, List<AccountSearchItem.ProjectCard>> userIdToCards =
                userIds.isEmpty()
                        ? Collections.emptyMap()
                        : projectRepo.findTop3CardsByUserIds(userIds).stream()
                        .collect(Collectors.groupingBy(
                                ProjectRepository.UserProjectCardRow::getUserId,
                                Collectors.mapping(row ->
                                                new AccountSearchItem.ProjectCard(
                                                        row.getProjectId(),
                                                        row.getCoverUrl()
                                                ),
                                        Collectors.toList()
                                )
                        ));

        // 3) 페이지 매핑
        Page<AccountSearchItem> mapped = page.map(row ->
                new AccountSearchItem(
                        row.getId(),
                        row.getNickname(),
                        row.getEmail(),
                        row.getAvatarUrl(),
                        row.getIsVerified(),
                        row.getPosition(),
                        userIdToCards.getOrDefault(row.getId(), List.of())
                )
        );

        return PageResponse.of(mapped);
    }
}
