package com.sandwich.SandWich.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UserProfileRequest {
    @NotBlank
    private String nickname;
    @NotNull
    private Long positionId;
    @Size(max = 3) private List<Long> interestIds;
    private String bio;
    private String skills;
    private String github;
    private String linkedin;
    private String profileImageUrl;
    private String coverImageUrl;
}
