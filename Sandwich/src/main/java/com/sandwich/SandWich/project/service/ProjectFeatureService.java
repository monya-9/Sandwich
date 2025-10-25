package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectFeatureService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void setRepresentativeProjects(Long userId, List<Long> ids) {
        // 1) 내 모든 포트폴리오 프로젝트 대표 해제
        projectRepository.clearRepresentativeByUserId(userId);

        // 2) 선택한 id만 대표 지정
        if (ids == null || ids.isEmpty()) return;

        for (Long id : ids) {
            projectRepository.findByIdAndUserId(id, userId)
                    .ifPresent(p -> p.setRepresentative(true));
        }
    }

    @Transactional(readOnly = true)
    public List<Project> getRepresentativeProjects(User user) {
        return projectRepository.findByUserAndIsRepresentativeTrue(user);
    }
}
