package com.sandwich.SandWich.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NicknameUpdateRequest(
        @NotBlank
        @Size(min = 2, max = 20)
        String nickname
) {}
