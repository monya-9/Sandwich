package com.sandwich.SandWich.user.dto;


import java.util.List;

public record SocialProfileRequest(
        String username,
        Long positionId,
        List<Long> interestIds
) {}