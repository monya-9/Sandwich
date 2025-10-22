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

    public void setRepresentativeCareers(Long userId, List<Long> ids) {
        User user = getUser(userId);

        // 1) 내 커리어 전부 대표 해제
        List<Career> myCareers = careerRepository.findByUser(user);
        for (Career c : myCareers) {
            // 단일 세터가 없어서 기존 update(...) 사용
            c.update(
                    c.getRole(), c.getCompanyName(), c.getStartYear(), c.getStartMonth(),
                    c.getEndYear(), c.getEndMonth(), c.isWorking(), c.getDescription(), false
            );
        }

        // 2) 선택한 id만 대표 지정 (null/빈 배열이면 전체 해제로 끝)
        if (ids == null || ids.isEmpty()) return;

        for (Long id : ids) {
            Career c = careerRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 커리어 없음"));
            if (!c.getUser().getId().equals(userId)) continue; // 소유자만 허용
            c.update(
                    c.getRole(), c.getCompanyName(), c.getStartYear(), c.getStartMonth(),
                    c.getEndYear(), c.getEndMonth(), c.isWorking(), c.getDescription(), true
            );
        }
    }

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
