package com.sandwich.SandWich.social.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LikeResponse {

    private long likeCount;
    private boolean likedByMe;

}
