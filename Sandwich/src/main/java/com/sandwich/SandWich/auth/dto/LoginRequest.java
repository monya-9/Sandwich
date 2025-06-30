package com.sandwich.SandWich.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter @Setter
public class LoginRequest {
    private String email;
    private String password;
}