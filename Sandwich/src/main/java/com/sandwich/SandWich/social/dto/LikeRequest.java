package com.sandwich.SandWich.social.dto;

import com.sandwich.SandWich.social.domain.LikeTargetType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LikeRequest {
    private Long targetId;
    private LikeTargetType targetType;
}
