package com.sandwich.SandWich.search.dto;


import com.sandwich.SandWich.search.domain.RecentSearchType;
import java.time.OffsetDateTime;

public record RecentSearchItem(
        Long id,
        String keyword,
        RecentSearchType type,
        OffsetDateTime updatedAt
) {}