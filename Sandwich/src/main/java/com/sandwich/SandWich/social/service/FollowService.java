package com.sandwich.SandWich.social.service;

import com.sandwich.SandWich.notification.dto.FollowNotificationPayload;
import com.sandwich.SandWich.notification.events.FollowCreatedEvent;
import com.sandwich.SandWich.notification.service.FollowNotificationService;
import com.sandwich.SandWich.social.domain.Follow;
import com.sandwich.SandWich.social.dto.FollowCountResponse;
import com.sandwich.SandWich.social.dto.FollowStatusResponse;
import com.sandwich.SandWich.social.repository.FollowRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.dto.SimpleUserResponse;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.UserNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final FollowNotificationService followNotificationService; // (빈 구현체라도 있어야 함)
    private final ApplicationEventPublisher events;

    @Value("${app.system.user-id}")
    private Long systemUserId;

    @Transactional
    public FollowStatusResponse follow(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("팔로우 대상 유저가 존재하지 않습니다."));

        // 자기 자신/시스템 계정 제한
        if (currentUser.getId().equals(targetUserId)) {
            return status(currentUser, targetUserId);
        }
        if (currentUser.getId().equals(systemUserId)) {
            return status(currentUser, targetUserId);
        }

        // 이미 팔로우 중이면 idempotent
        if (!followRepository.existsByFollowerAndFollowing(currentUser, targetUser)) {
            try {
                followRepository.save(new Follow(currentUser, targetUser));
            } catch (DataIntegrityViolationException ignore) {
                // 다른 트랜잭션이 먼저 넣은 경우: 무시
            }

            // 대상이 시스템 계정이면 알림 스킵
            if (!targetUser.getId().equals(systemUserId)) {
                events.publishEvent(new FollowCreatedEvent(currentUser.getId(), targetUser.getId()));
            }
        }

        return status(currentUser, targetUserId);
    }

    @Transactional
    public FollowStatusResponse unfollow(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("언팔로우 대상 유저가 존재하지 않습니다."));

        Optional<Follow> follow = followRepository.findByFollowerAndFollowing(currentUser, targetUser);
        follow.ifPresent(followRepository::delete);

        return status(currentUser, targetUserId);
    }


    @Transactional(readOnly = true)
    public boolean isFollowing(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("팔로우 상태 확인 대상 유저가 존재하지 않습니다."));
        return followRepository.existsByFollowerAndFollowing(currentUser, targetUser);
    }

    private void sendFollowNotification(User target, User sender) {
        FollowNotificationPayload payload = FollowNotificationPayload.builder()
                .senderId(sender.getId())
                .nickname(sender.getNickname())
                .profileImg(sender.getProfileImageUrl())
                .link("/profile/" + sender.getId()) // 또는 앱 딥링크
                .build();

        followNotificationService.send(payload); // 알림 전송은 나중에 구현
    }

    @Transactional(readOnly = true)
    public List<SimpleUserResponse> getFollowingList(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("팔로잉 목록 대상 유저가 존재하지 않습니다."));

        return followRepository.findByFollower(user).stream()
                .map(follow -> {
                    User target = follow.getFollowing();
                    return new SimpleUserResponse(
                            target.getId(),
                            target.getNickname(),
                            target.getProfileImageUrl()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SimpleUserResponse> getFollowerList(Long userId) {
        List<User> followers = followRepository.findFollowersByUserId(userId);
        return followers.stream()
                .map(user -> new SimpleUserResponse(
                        user.getId(),
                        user.getNickname(),
                        user.getProfileImageUrl()))
                .toList();
    }

    @Transactional(readOnly = true)
    public FollowCountResponse getFollowCounts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("팔로우 수 조회 대상 유저가 존재하지 않습니다."));

        long followerCount = followRepository.countByFollowing(user);
        long followingCount = followRepository.countByFollower(user);

        return new FollowCountResponse(followerCount, followingCount);
    }

    @Transactional(readOnly = true)
    public FollowStatusResponse status(User meOrNull, Long targetUserId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("유저가 존재하지 않습니다."));
        boolean following = (meOrNull != null) && followRepository.existsByFollowerAndFollowing(meOrNull, target);
        long followerCount = followRepository.countByFollowing(target);
        return new FollowStatusResponse(following, followerCount);
    }

}
