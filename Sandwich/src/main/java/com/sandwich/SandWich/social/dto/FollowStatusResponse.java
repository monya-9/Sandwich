package com.sandwich.SandWich.social.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowStatusResponse {
    private boolean following;   // 내가 지금 팔로우 중인지
    private long followerCount;  // 대상의 팔로워 수 (뷰 즉시 반영)
}