package com.sandwich.SandWich.user.service;


import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.user.domain.*;
import com.sandwich.SandWich.user.dto.SocialProfileRequest;
import com.sandwich.SandWich.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final InterestRepository interestRepository;
    private final UserPositionRepository userPositionRepository;
    private final UserInterestRepository userInterestRepository;

    public void saveProfile(User user, SignupRequest req) {
        user.setUsername(req.username());
        user.setIsVerified(true);

        Position position = positionRepository.findById(req.positionId())
                .orElseThrow(() -> new IllegalArgumentException("포지션 없음"));
        userPositionRepository.save(new UserPosition(user, position));

        if (req.interestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }

        for (Long interestId : req.interestIds()) {
            Interest interest = interestRepository.findById(interestId)
                    .orElseThrow(() -> new IllegalArgumentException("관심사 없음"));
            userInterestRepository.save(new UserInterest(user, interest));
        }

        userRepository.save(user);
    }

    public void saveProfile(User user, SocialProfileRequest req) {
        user.setUsername(req.username());
        user.setIsVerified(true);

        Position position = positionRepository.findById(req.positionId())
                .orElseThrow(() -> new IllegalArgumentException("포지션 없음"));
        userPositionRepository.save(new UserPosition(user, position));

        if (req.interestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }

        for (Long interestId : req.interestIds()) {
            Interest interest = interestRepository.findById(interestId)
                    .orElseThrow(() -> new IllegalArgumentException("관심사 없음"));
            userInterestRepository.save(new UserInterest(user, interest));
        }

        userRepository.save(user);
    }
}
