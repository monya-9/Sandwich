package com.sandwich.SandWich.social.service;

import org.springframework.lang.Nullable;
import com.sandwich.SandWich.social.domain.Like;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.social.dto.LikeResponse;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;

    public LikeResponse toggleLike(User user, LikeTargetType targetType, Long targetId) {
        Optional<Like> existing = likeRepository.findByUserAndTargetTypeAndTargetId(user, targetType, targetId);

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
        } else {
            likeRepository.save(new Like(user, targetType, targetId));
        }

        long count = likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
        boolean liked = likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);
        return new LikeResponse(count, liked);
    }

    public LikeResponse getLikeStatus(@Nullable User user, LikeTargetType targetType, Long targetId) {
        long count = likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
        boolean liked = (user != null) && likeRepository.existsByUserAndTargetTypeAndTargetId(user, targetType, targetId);
        return new LikeResponse(count, liked);
    }
}
