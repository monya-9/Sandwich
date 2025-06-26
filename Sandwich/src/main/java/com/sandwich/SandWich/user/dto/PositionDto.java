package com.sandwich.SandWich.user.dto;

import com.sandwich.SandWich.user.domain.Position;
import lombok.Getter;

@Getter
public class PositionDto {
    private final Long id;
    private final String name;

    public PositionDto(Position position) {
        this.id = position.getId();
        this.name = position.getName();
    }
}