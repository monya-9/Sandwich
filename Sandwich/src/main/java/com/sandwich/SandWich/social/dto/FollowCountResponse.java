package com.sandwich.SandWich.social.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowCountResponse {
    private long followerCount;
    private long followingCount;
}