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
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.common.dto.PageResponse;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final LikeTargetResolver targetResolver;
    private final ApplicationEventPublisher events;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

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

    @Transactional(readOnly = true)
    public PageResponse<ProjectListItemResponse> getLikedProjectsByUserId(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Page<Like> likes = likeRepository.findAllByUserAndTargetType(user, LikeTargetType.PROJECT, pageable);
        List<Long> projectIds = likes.getContent().stream()
                .map(Like::getTargetId)
                .collect(Collectors.toList());

        if (projectIds.isEmpty()) {
            Page<Project> empty = Page.empty(pageable);
            return PageResponse.of(empty.map(ProjectListItemResponse::new));
        }

        List<Project> projects = projectRepository.findAllById(projectIds);
        Map<Long, Project> projectById = projects.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Project::getId, Function.identity(), (a, b) -> a));

        List<Project> ordered = projectIds.stream()
                .map(projectById::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Page<Project> page = new PageImpl<>(ordered, pageable, likes.getTotalElements());
        return PageResponse.of(page.map(ProjectListItemResponse::new));
    }
}
