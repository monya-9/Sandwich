package com.sandwich.SandWich.user.dto;

import jakarta.validation.constraints.NotNull;

public record PositionUpdateRequest(
        @NotNull Long positionId
) {}
