package com.sandwich.SandWich.career.service;

import com.sandwich.SandWich.career.domain.Career;
import com.sandwich.SandWich.career.dto.CareerRequest;
import com.sandwich.SandWich.career.dto.CareerResponse;
import com.sandwich.SandWich.career.repository.CareerRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CareerService {

    private final CareerRepository careerRepository;
    private final UserRepository userRepository;

    public void createCareer(CareerRequest request, Long userId) {
        User user = getUser(userId);
        Career career = new Career(
                request.role(),
                request.companyName(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.isWorking(),
                request.description(),
                request.isRepresentative(),
                user
        );
        careerRepository.save(career);
    }

    public void updateCareer(Long id, CareerRequest request, Long userId) {
        Career career = getCareerForUser(id, userId);
        career.update(
                request.role(),
                request.companyName(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.isWorking(),
                request.description(),
                request.isRepresentative()
        );
    }

    public void deleteCareer(Long id, Long userId) {
        Career career = getCareerForUser(id, userId);
        careerRepository.delete(career);
    }

    public List<CareerResponse> getMyCareers(Long userId) {
        User user = getUser(userId);
        return careerRepository.findByUser(user)
                .stream()
                .map(CareerResponse::from)
                .toList();
    }

    public boolean toggleRepresentative(Long id, Long userId) {
        Career career = getCareerForUser(id, userId);
        career.toggleRepresentative();
        return career.isRepresentative(); // 토글 후 현재 값 리턴
    }
    public List<Career> getRepresentativeCareers(User user) {
        return careerRepository.findByUserAndIsRepresentativeTrue(user);
    }

    private Career getCareerForUser(Long id, Long userId) {
        Career career = careerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 커리어 없음"));
        if (!career.getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        return career;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }
}
