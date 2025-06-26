package com.sandwich.SandWich.user.dto;

import com.sandwich.SandWich.user.domain.Interest;
import lombok.Getter;

@Getter
public class InterestDto {
    private final Long id;
    private final String name;

    public InterestDto(Interest interest) {
        this.id = interest.getId();
        this.name = interest.getName();
    }
}