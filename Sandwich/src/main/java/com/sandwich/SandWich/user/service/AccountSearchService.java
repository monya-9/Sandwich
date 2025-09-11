package com.sandwich.SandWich.user.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.user.dto.AccountSearchItem;
import com.sandwich.SandWich.user.repository.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountSearchService {

    private final UserSearchRepository repo;

    @Transactional(readOnly = true)
    public PageResponse<AccountSearchItem> search(String rawQ, Pageable pageable) {
        String q = rawQ == null ? "" : rawQ.trim();
        if (q.isEmpty()) {
            return PageResponse.of(Page.empty(pageable));
        }
        return PageResponse.of(repo.searchAccounts(q, pageable));
    }
}