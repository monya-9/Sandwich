package com.sandwich.SandWich.search.dto;

import com.sandwich.SandWich.search.domain.RecentSearchType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecentSearchRequest(
        @NotBlank String keyword,
        @NotNull RecentSearchType type
) {}