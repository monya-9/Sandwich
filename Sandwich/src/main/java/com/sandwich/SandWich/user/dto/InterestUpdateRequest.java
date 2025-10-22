package com.sandwich.SandWich.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.List;

public record InterestUpdateRequest(
        @JsonAlias({"interestIds", "interests", "ids"})
        List<Long> interestIds
) {}