package com.sandwich.SandWich.user.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.dto.AccountSearchItem;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.repository.UserAccountRow;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
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

        // userIds 수집
        List<Long> userIds = page.getContent().stream()
                .map(UserAccountRow::getId)
                .toList();

        // 사용자별 최신 프로젝트 3개 id 로드
        Map<Long, List<Long>> userIdToProjectIds = Collections.emptyMap();
        if (!userIds.isEmpty()) {
            userIdToProjectIds = projectRepo.findTop3IdsByUserIds(userIds).stream()
                    .collect(Collectors.groupingBy(
                            ProjectRepository.UserProjectIdRow::getUserId,
                            Collectors.mapping(ProjectRepository.UserProjectIdRow::getProjectId, Collectors.toList())
                    ));
        }

        // 람다에서 쓸 final 변수로 따로 할당
        final Map<Long, List<Long>> finalUserIdToProjectIds = userIdToProjectIds;

        Page<AccountSearchItem> mapped = page.map(row -> {
            List<Long> ids = finalUserIdToProjectIds.getOrDefault(row.getId(), List.of());
            List<AccountSearchItem.ProjectIdOnly> projects = ids.stream()
                    .map(AccountSearchItem.ProjectIdOnly::new)
                    .toList();
            return new AccountSearchItem(
                    row.getId(),
                    row.getNickname(),
                    row.getEmail(),
                    row.getAvatarUrl(),
                    row.getIsVerified(),
                    row.getPosition(),
                    projects
            );
        });
        return PageResponse.of(mapped);
    }
}