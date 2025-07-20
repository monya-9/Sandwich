package com.sandwich.SandWich.social.dto;

import com.sandwich.SandWich.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LikedUserResponse {
    private Long userId;
    private String nickname;
    private String profileImageUrl;

}
