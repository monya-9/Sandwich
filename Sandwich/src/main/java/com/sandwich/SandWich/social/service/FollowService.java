package com.sandwich.SandWich.social.service;

import com.sandwich.SandWich.notification.dto.FollowNotificationPayload;
import com.sandwich.SandWich.notification.service.FollowNotificationService;
import com.sandwich.SandWich.social.domain.Follow;
import com.sandwich.SandWich.social.repository.FollowRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.dto.FollowingUserResponse;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final FollowNotificationService followNotificationService; // (빈 구현체라도 있어야 함)

    @Transactional
    public void follow(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("팔로우 대상 유저가 존재하지 않습니다."));

        // 자기 자신은 팔로우 불가
        if (currentUser.equals(targetUser)) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
        }

        // 중복 팔로우 방지
        if (followRepository.existsByFollowerAndFollowing(currentUser, targetUser)) {
            return; // 이미 팔로우 상태
        }

        Follow follow = Follow.builder()
                .follower(currentUser)
                .following(targetUser)
                .build();

        followRepository.save(follow);

        // 알림 전송 (실제 메시지는 나중에 구현)
        sendFollowNotification(targetUser, currentUser);
    }

    @Transactional
    public void unfollow(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("언팔로우 대상 유저가 존재하지 않습니다."));

        Optional<Follow> follow = followRepository.findByFollowerAndFollowing(currentUser, targetUser);
        follow.ifPresent(followRepository::delete);
    }

    @Transactional
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

    @Transactional
    public List<FollowingUserResponse> getFollowingList(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("팔로잉 목록 대상 유저가 존재하지 않습니다."));

        return followRepository.findByFollower(user).stream()
                .map(follow -> {
                    User target = follow.getFollowing();
                    return new FollowingUserResponse(
                            target.getId(),
                            target.getNickname(),
                            target.getProfileImageUrl()
                    );
                })
                .collect(Collectors.toList());
    }
}
