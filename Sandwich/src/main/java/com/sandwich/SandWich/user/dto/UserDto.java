package com.sandwich.SandWich.user.dto;
import com.sandwich.SandWich.user.domain.User;

import lombok.Getter;

@Getter
public class UserDto {
    private Long id;
    private String username;
    private String email;

    public UserDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
    }
}
