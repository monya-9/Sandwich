package com.sandwich.SandWich.auth.dto;

import com.sandwich.SandWich.auth.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
public class SignupRequest {

    @Email
    @NotBlank
    private String email;

    @ValidPassword
    private String password;

    @NotBlank
    private String nickname;

    @NotNull
    private Long positionId;

    @NotNull
    private List<Long> interestIds;
}