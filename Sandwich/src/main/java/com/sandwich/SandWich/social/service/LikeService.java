package com.sandwich.SandWich.social.service;

import com.sandwich.SandWich.notification.events.LikeCreatedEvent;
import com.sandwich.SandWich.social.dto.LikedUserResponse;
import com.sandwich.SandWich.social.support.LikeTargetResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
import com.sandwich.SandWich.social.domain.Like;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.social.dto.LikeResponse;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final LikeTargetResolver targetResolver;
    private final ApplicationEventPublisher events;

    @Value("${app.system.user-id}")
    private Long systemUserId;

    @Transactional
    public LikeResponse toggleLike(User user, LikeTargetType targetType, Long targetId) {
        Optional<Like> existing = likeRepository.findByUserAndTargetTypeAndTargetId(user, targetType, targetId);


        boolean created = false;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
        } else {
            // 시스템 계정이면 저장 자체를 막음(안 누른다고 했으나 안전핀)
            if (user.getId() != null && user.getId().equals(systemUserId)) {
                // do nothing
            } else {
                // 동시성 대비: 유니크 충돌 시 중복 알림 방지
                try {
                    likeRepository.save(new Like(user, targetType, targetId));
                    created = true;
                } catch (DataIntegrityViolationException e) {
                    // 다른 트랜잭션이 먼저 넣은 경우: 이미 좋아요 상태라고 간주
                    created = false;
                }
            }
        }

        long count = likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
        boolean liked = likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);

        // 새로 생성된 경우에만 알림 이벤트 발행(Unlike는 알림 없음)
        if (created) {
            String typeStr = targetType.name(); // enum이 이미 PROJECT/POST/COMMENT라고 가정
            targetResolver.resolveTargetUserId(typeStr, targetId)
                    .filter(tid -> !tid.equals(user.getId())) // 자기 자신이면 스킵
                    .ifPresent(tid -> events.publishEvent(
                            new LikeCreatedEvent(user.getId(), typeStr, targetId, tid)
                    ));
        }

        return new LikeResponse(count, liked);
    }

    public LikeResponse getLikeStatus(@Nullable User user, LikeTargetType targetType, Long targetId) {
        long count = likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
        boolean liked = (user != null) && likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);
        return new LikeResponse(count, liked);
    }



    public Page<LikedUserResponse> getLikedUsers(LikeTargetType targetType, Long targetId, Pageable pageable) {
        return likeRepository.findAllByTargetTypeAndTargetId(targetType, targetId, pageable)
                .map(like -> {
                    User user = like.getUser();
                    return new LikedUserResponse(user.getId(), user.getNickname(), user.getProfileImageUrl());
                });
    }
}
