package com.sandwich.SandWich.user.dto;


import jakarta.validation.constraints.NotNull;
import java.util.List;

public record InterestUpdateRequest(@NotNull List<Long> interestIds) {}
