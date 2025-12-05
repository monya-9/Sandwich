package com.sandwich.SandWich.representative.controller;

import com.sandwich.SandWich.award.dto.AwardResponse;
import com.sandwich.SandWich.award.service.AwardService;
import com.sandwich.SandWich.career.dto.CareerResponse;
import com.sandwich.SandWich.career.service.CareerService;
import com.sandwich.SandWich.careerProject.dto.CareerProjectResponse;
import com.sandwich.SandWich.careerProject.service.CareerProjectService;
import com.sandwich.SandWich.education.dto.EducationResponse;
import com.sandwich.SandWich.education.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 타인 프로필에서 "자세히 보기" 눌렀을 때 사용하는 공개용 전체 커리어 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class PublicCareerDetailController {

    private final CareerService careerService;
    private final EducationService educationService;
    private final AwardService awardService;
    private final CareerProjectService careerProjectService;

    // 1) 경력 전체
    @GetMapping("/{userId}/careers")
    public ResponseEntity<List<CareerResponse>> getCareers(@PathVariable Long userId) {
        return ResponseEntity.ok(careerService.getMyCareers(userId));
    }

    // 2) 학력 전체
    @GetMapping("/{userId}/educations")
    public ResponseEntity<List<EducationResponse>> getEducations(@PathVariable Long userId) {
        return ResponseEntity.ok(educationService.getMyEducations(userId));
    }

    // 3) 수상 전체
    @GetMapping("/{userId}/awards")
    public ResponseEntity<List<AwardResponse>> getAwards(@PathVariable Long userId) {
        return ResponseEntity.ok(awardService.getMyAwards(userId));
    }

    // 4) 이력용 프로젝트 전체
    @GetMapping("/{userId}/career-projects")
    public ResponseEntity<List<CareerProjectResponse>> getCareerProjects(@PathVariable Long userId) {
        return ResponseEntity.ok(careerProjectService.getMyProjects(userId));
    }
}
