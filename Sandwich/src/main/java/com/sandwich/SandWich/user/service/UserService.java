package com.sandwich.SandWich.user.service;


import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.global.exception.exceptiontype.InterestNotFoundException;
import com.sandwich.SandWich.global.exception.exceptiontype.PositionNotFoundException;
import com.sandwich.SandWich.user.domain.*;
import com.sandwich.SandWich.user.dto.InterestDto;
import com.sandwich.SandWich.user.dto.PositionDto;
import com.sandwich.SandWich.user.dto.SocialProfileRequest;
import com.sandwich.SandWich.user.dto.UserDto;
import com.sandwich.SandWich.user.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final InterestRepository interestRepository;
    private final UserPositionRepository userPositionRepository;
    private final UserInterestRepository userInterestRepository;

    public void saveProfile(User user, SignupRequest req) {
        user.setUsername(req.getUsername());
        user.setIsVerified(true);

        Position position = positionRepository.findById(req.getPositionId())
                .orElseThrow(PositionNotFoundException::new);
        userPositionRepository.save(new UserPosition(user, position));

        if (req.getInterestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }

        for (Long interestId : req.getInterestIds()) {
            Interest interest = interestRepository.findById(interestId)
                    .orElseThrow(InterestNotFoundException::new);
            userInterestRepository.save(new UserInterest(user, interest));
        }

        userRepository.save(user);
    }



    public void saveProfile(User user, SocialProfileRequest req) {
        user.setUsername(req.username());
        user.setIsVerified(true);

        Position position = positionRepository.findById(req.positionId())
                .orElseThrow(PositionNotFoundException::new);
        userPositionRepository.save(new UserPosition(user, position));

        if (req.interestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }

        for (Long interestId : req.interestIds()) {
            Interest interest = interestRepository.findById(interestId)
                    .orElseThrow(InterestNotFoundException::new);
            userInterestRepository.save(new UserInterest(user, interest));
        }

        userRepository.save(user);
    }

    @Transactional
    public UserDto getMe(User user) {
        Position position = user.getUserPosition() != null ? user.getUserPosition().getPosition() : null;
        List<InterestDto> interestDtos = user.getInterests().stream()
                .map(userInterest -> new InterestDto(userInterest.getInterest()))
                .collect(Collectors.toList());

        return new UserDto(user, position != null ? new PositionDto(position) : null, interestDtos);
    }

}
