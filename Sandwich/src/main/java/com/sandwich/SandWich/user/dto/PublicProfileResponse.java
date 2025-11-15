package com.sandwich.SandWich.user.dto;

import java.util.List;

public record PublicProfileResponse(
        Long id,
        String nickname,
        String username,
        String profileSlug,
        String email,
        String position,
        List<String> interests,
        String profileImage,
        String coverImage,
        String bio
) {}