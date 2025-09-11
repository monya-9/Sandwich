package com.sandwich.SandWich.user.dto;

public record AccountSearchItem(
        Long id,
        String nickname,
        String avatarUrl,
        Boolean isVerified
) {}