package com.sandwich.SandWich.user.dto;

import lombok.*;

@Getter
@AllArgsConstructor
public class SimpleUserResponse {
    private Long id;
    private String nickname;
    private String profileImageUrl;
}