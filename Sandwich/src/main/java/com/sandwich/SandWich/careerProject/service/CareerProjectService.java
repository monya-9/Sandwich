package com.sandwich.SandWich.careerProject.service;

import com.sandwich.SandWich.careerProject.domain.CareerProject;
import com.sandwich.SandWich.careerProject.dto.CareerProjectRequest;
import com.sandwich.SandWich.careerProject.dto.CareerProjectResponse;
import com.sandwich.SandWich.careerProject.repository.CareerProjectRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CareerProjectService {

    private final CareerProjectRepository repository;
    private final UserRepository userRepository;

    public void create(CareerProjectRequest request, Long userId) {
        User user = getUser(userId);
        CareerProject project = new CareerProject(
                request.title(), request.techStack(), request.role(),
                request.startYear(), request.startMonth(),
                request.endYear(), request.endMonth(),
                request.description(), request.isRepresentative(), user
        );
        repository.save(project);
    }

    public void setRepresentativeProjects(Long userId, List<Long> ids) {
        User user = getUser(userId);

        // 1) 내 이력-프로젝트 전부 대표 해제
        List<CareerProject> my = repository.findByUser(user);
        for (CareerProject p : my) {
            p.update(p.getTitle(), p.getTechStack(), p.getRole(),
                    p.getStartYear(), p.getStartMonth(), p.getEndYear(), p.getEndMonth(),
                    p.getDescription(), false);
        }

        // 2) 선택한 id만 대표 지정
        if (ids == null || ids.isEmpty()) return;

        for (Long id : ids) {
            CareerProject p = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트 없음"));
            if (!p.getUser().getId().equals(userId)) continue;
            p.update(p.getTitle(), p.getTechStack(), p.getRole(),
                    p.getStartYear(), p.getStartMonth(), p.getEndYear(), p.getEndMonth(),
                    p.getDescription(), true);
        }
    }

    public void update(Long id, CareerProjectRequest request, Long userId) {
        CareerProject p = getByIdAndUser(id, userId);
        p.update(
                request.title(), request.techStack(), request.role(),
                request.startYear(), request.startMonth(),
                request.endYear(), request.endMonth(),
                request.description(), request.isRepresentative()
        );
    }

    public void delete(Long id, Long userId) {
        CareerProject p = getByIdAndUser(id, userId);
        repository.delete(p);
    }

    public List<CareerProjectResponse> getMyProjects(Long userId) {
        return repository.findByUser(getUser(userId))
                .stream().map(CareerProjectResponse::from).toList();
    }

    public boolean toggleRepresentative(Long id, Long userId) {
        CareerProject p = getByIdAndUser(id, userId);
        p.toggleRepresentative();
        return p.isRepresentative();
    }

    public List<CareerProject> getRepresentativeProjects(User user) {
        return repository.findByUserAndIsRepresentativeTrue(user);
    }

    private CareerProject getByIdAndUser(Long id, Long userId) {
        CareerProject p = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트 없음"));
        if (!p.getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        return p;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }
}