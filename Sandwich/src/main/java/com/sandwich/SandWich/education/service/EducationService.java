package com.sandwich.SandWich.education.service;

import com.sandwich.SandWich.education.domain.Education;
import com.sandwich.SandWich.education.dto.EducationRequest;
import com.sandwich.SandWich.education.dto.EducationResponse;
import com.sandwich.SandWich.education.repository.EducationRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EducationService {

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;

    public void create(EducationRequest request, Long userId) {
        User user = getUser(userId);
        Education edu = new Education(
                request.schoolName(),
                request.degree(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.description(),
                request.isRepresentative(),
                user
        );
        educationRepository.save(edu);
    }

    public void update(Long id, EducationRequest request, Long userId) {
        Education e = getByIdAndUser(id, userId);
        e.update(
                request.schoolName(),
                request.degree(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.description(),
                request.isRepresentative()
        );
    }

    public void delete(Long id, Long userId) {
        Education e = getByIdAndUser(id, userId);
        educationRepository.delete(e);
    }

    public List<EducationResponse> getMyEducations(Long userId) {
        return educationRepository.findByUser(getUser(userId))
                .stream().map(EducationResponse::from).toList();
    }

    public boolean toggleRepresentative(Long id, Long userId) {
        Education e = getByIdAndUser(id, userId);
        e.toggleRepresentative();
        return e.isRepresentative();
    }

    public List<Education> getRepresentativeEducations(User user) {
        return educationRepository.findByUserAndIsRepresentativeTrue(user);
    }

    private Education getByIdAndUser(Long id, Long userId) {
        Education e = educationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 학력 없음"));
        if (!e.getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        return e;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }
}
