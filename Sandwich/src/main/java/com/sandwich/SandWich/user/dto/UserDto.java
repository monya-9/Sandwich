package com.sandwich.SandWich.user.dto;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.domain.UserInterest;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class UserDto {
    private String username;
    private String email;
    private PositionDto position;
    private List<InterestDto> interests;

    public UserDto(User user, PositionDto positionDto, List<InterestDto> interestDtos) {
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.position = positionDto;
        this.interests = interestDtos;

        // 포지션 변환
        if (user.getUserPosition() != null) {
            this.position = new PositionDto(user.getUserPosition().getPosition());
        }

        // 관심 분야 리스트 변환
        this.interests = user.getInterests().stream()
                .map(UserInterest::getInterest)
                .map(InterestDto::new)
                .collect(Collectors.toList());
    }
}
