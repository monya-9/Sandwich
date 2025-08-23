package com.sandwich.SandWich.message.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class RoomParticipantResponse {
    private Long id;              // userId
    private String nickname;      // 프로필 닉네임
    private String profileImage;  // 프로필 이미지

}
