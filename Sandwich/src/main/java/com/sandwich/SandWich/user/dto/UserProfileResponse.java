package com.sandwich.SandWich.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@AllArgsConstructor
@Data
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String profileSlug;
    private String bio;
    private String skills;
    private String github;
    private String linkedin;
    private String profileImage;
    private PositionDto position;
    private List<InterestDto> interests;
    private int followerCount;
    private int followingCount;

}