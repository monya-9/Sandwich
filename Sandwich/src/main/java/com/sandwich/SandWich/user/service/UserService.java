package com.sandwich.SandWich.user.service;


import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.global.exception.exceptiontype.InterestNotFoundException;
import com.sandwich.SandWich.global.exception.exceptiontype.PositionNotFoundException;
import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.user.domain.*;
import com.sandwich.SandWich.user.dto.*;
import com.sandwich.SandWich.user.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final InterestRepository interestRepository;
    private final UserPositionRepository userPositionRepository;
    private final UserInterestRepository userInterestRepository;
    private final ProfileRepository profileRepository;

    @Transactional
    public void upsertUserProfile(User user, UserProfileRequest req) {
        // 기본 설정
        user.setUsername(req.getUsername());
        user.setIsVerified(true);  // 프로필 작성 여부
        user.setIsProfileSet(true);


        // 포지션
        Position position = positionRepository.findById(req.getPositionId())
                .orElseThrow(PositionNotFoundException::new);
        Optional<UserPosition> existing = userPositionRepository.findByUser(user);
        if (existing.isPresent()) {
            UserPosition userPosition = existing.get();
            userPosition.setPosition(position);
            userPositionRepository.save(userPosition);
        } else {
            userPositionRepository.save(new UserPosition(user, position));
        }

        // 관심사
        if (req.getInterestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }
        userInterestRepository.deleteByUser(user); // 기존 삭제 후
        for (Long id : req.getInterestIds()) {
            Interest interest = interestRepository.findById(id)
                    .orElseThrow(InterestNotFoundException::new);
            userInterestRepository.save(new UserInterest(user, interest));
        }

        // 프로필 (bio, github, etc)
        Profile profile = user.getProfile(); // 기존 있는지 확인
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
            user.setProfile(profile);
        }
        profile.updateFrom(req);

        // 저장
        userRepository.save(user);
    }

    @Transactional
    public UserProfileResponse getMe(User user) {
        Profile profile = user.getProfile();

        Position position = user.getUserPosition() != null
                ? user.getUserPosition().getPosition()
                : null;

        List<InterestDto> interests = user.getInterests().stream()
                .map(ui -> new InterestDto(ui.getInterest()))
                .collect(Collectors.toList());

        int followerCount = user.getFollowers().size();
        int followingCount = user.getFollowings().size();

        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                profile != null ? profile.getBio() : null,
                profile != null ? profile.getSkills() : null,
                profile != null ? profile.getGithub() : null,
                profile != null ? profile.getLinkedin() : null,
                profile != null ? profile.getProfileImage() : null,
                position != null ? new PositionDto(position) : null,
                interests,
                followerCount,
                followingCount
        );
    }
    public User findByEmail(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(UserNotFoundException::new);

        if (user.isDeleted()) {
            throw new UserNotFoundException();
        }

        return user;
    }

    public void saveBasicProfile(User user, SignupRequest req) {
        user.setUsername(req.getUsername());

        Position position = positionRepository.findById(req.getPositionId())
                .orElseThrow(PositionNotFoundException::new);
        Optional<UserPosition> existing = userPositionRepository.findByUser(user);
        if (existing.isPresent()) {
            UserPosition userPosition = existing.get();
            userPosition.setPosition(position); // 업데이트
            userPositionRepository.save(userPosition);
        } else {
            userPositionRepository.save(new UserPosition(user, position)); // 신규 저장
        }
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

}
