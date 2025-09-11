package com.sandwich.SandWich.user.meta.service;

import com.sandwich.SandWich.user.domain.InterestType;
import com.sandwich.SandWich.user.dto.InterestResponse;
import com.sandwich.SandWich.user.dto.PositionResponse;

import java.util.List;

public interface MetaService {
    List<InterestResponse> getInterestsByType(InterestType type);
    List<PositionResponse> getPositions();
}
