package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.project.dto.ProjectMetaSummary;
import com.sandwich.SandWich.social.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectMetaService {
    private final ProjectViewQueryService viewQueryService;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;

    public java.util.Map<Long, ProjectMetaSummary> summary(java.util.List<Long> ids) {
        var result = new java.util.HashMap<Long, ProjectMetaSummary>();

        // 일괄 집계
        var likeRows = likeRepository.countByTargetTypeAndTargetIdIn(
                com.sandwich.SandWich.social.domain.LikeTargetType.PROJECT, ids);
        var likeMap = new java.util.HashMap<Long, Long>();
        likeRows.forEach(r -> likeMap.put(r.getId(), r.getCnt()));

        var commentRows = commentRepository.countByTypeAndIds("Project", ids);
        var commentMap = new java.util.HashMap<Long, Long>();
        commentRows.forEach(r -> commentMap.put(r.getId(), r.getCnt()));

        // views는 Redis+DB 합산 (per-id)
        for (Long id : ids) {
            long views = java.util.Optional.ofNullable(viewQueryService.getTotalViewCount(id)).orElse(0L);
            long likes = likeMap.getOrDefault(id, 0L);
            long comments = commentMap.getOrDefault(id, 0L);
            result.put(id, new ProjectMetaSummary(views, likes, comments));
        }
        return result;
    }
}
