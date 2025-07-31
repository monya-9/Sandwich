package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.domain.ProjectView;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.project.repository.ProjectViewRepository;
import com.sandwich.SandWich.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectViewService {

    private final ProjectRepository projectRepository;
    private final ProjectViewRepository projectViewRepository;
    private final RedisUtil redisUtil;

    private static final long TTL_HOURS = 1;

    @Transactional
    public void handleProjectView(Long projectId, User viewer, HttpServletRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트"));

        log.info("[조회 진입] viewerId={}, projectOwnerId={}",
                viewer != null ? viewer.getId() : null,
                project.getUser().getId());

        if (viewer != null && project.getUser().getId().equals(viewer.getId())) {
            return; // 자기 프로젝트는 조회수 제외
        }

        String redisKey = generateRedisKey(projectId, viewer, request);
        boolean isDuplicate = redisUtil.hasKey(redisKey);

        log.info("[Redis 중복 키 체크] redisKey={}, isDuplicate={}", redisKey, isDuplicate);

        if (!isDuplicate) {
            try {
                redisUtil.incrementViewCount("viewcount:project:" + projectId); // TTL 없이 증가만
                redisUtil.setDuplicateTTLKey(redisKey, TTL_HOURS, TimeUnit.HOURS); // TTL 있는 키 저장
            } catch (Exception e) {
                log.warn("Redis 장애 발생 → DB 직접 증가 fallback", e);

                // 자기 프로젝트는 제외 (이미 위에서 return 했지만 혹시 몰라 다시 체크)
                if (viewer == null || !project.getUser().getId().equals(viewer.getId())) {
                    project.setViewCount(project.getViewCount() + 1);
                    projectRepository.save(project); // 단발성 fallback
                }
            }
        }

        Optional<ProjectView> optionalView = (viewer != null)
                ? projectViewRepository.findByProjectAndViewer(project, viewer)
                : Optional.empty(); // 비회원은 매번 새로 insert

        if (optionalView.isPresent() && !isDuplicate) {
            optionalView.get().increaseCount();
        } else if (!isDuplicate) {  // 중복인 경우 insert 안 함
            projectViewRepository.save(ProjectView.builder()
                    .project(project)
                    .viewer(viewer) // 회원이면 user 객체, 비회원이면 null
                    .count(1)
                    .viewedAt(LocalDateTime.now())
                    .build());
        }
    }

    private String generateRedisKey(Long projectId, User viewer, HttpServletRequest request) {
        if (viewer != null) {
            return "view:project:" + projectId + ":user:" + viewer.getId();
        } else {
            String ip = request.getRemoteAddr();
            String ua = request.getHeader("User-Agent");
            return "view:project:" + projectId + ":ip:" + hash(ip) + ":ua:" + hash(ua);
        }
    }

    private String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("해시 실패", e);
        }
    }
}
