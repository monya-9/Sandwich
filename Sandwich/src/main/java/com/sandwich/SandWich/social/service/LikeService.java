package com.sandwich.SandWich.social.service;

import com.sandwich.SandWich.notification.events.LikeCreatedEvent;
import com.sandwich.SandWich.social.domain.Like;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.social.dto.LikeResponse;
import com.sandwich.SandWich.social.dto.LikedUserResponse;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.social.support.LikeTargetResolver;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
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
            if (user.getId() != null && user.getId().equals(systemUserId)) {
                // do nothing
            } else {
                try {
                    likeRepository.save(new Like(user, targetType, targetId));
                    created = true;
                } catch (DataIntegrityViolationException e) {
                    created = false;
                }
            }
        }

        long count = likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
        boolean liked = likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);

        if (created) {
            String typeStr = targetType.name();
            targetResolver.resolveTargetUserId(typeStr, targetId)
                    .filter(tid -> !tid.equals(user.getId()))
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
