package com.sandwich.SandWich.auth.dto;

import java.util.List;

public record SignupRequest(
        String email,
        String password,
        String username,
        Long positionId,
        List<Long> interestIds
) {}
