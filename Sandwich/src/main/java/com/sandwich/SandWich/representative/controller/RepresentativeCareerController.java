package com.sandwich.SandWich.representative.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.award.service.AwardService;
import com.sandwich.SandWich.career.service.CareerService;
import com.sandwich.SandWich.careerProject.service.CareerProjectService;
import com.sandwich.SandWich.education.service.EducationService;
import com.sandwich.SandWich.project.service.ProjectFeatureService;
import com.sandwich.SandWich.representative.dto.RepresentativeCareerResponse;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class RepresentativeCareerController {

    private final CareerService careerService;
    private final EducationService educationService;
    private final AwardService awardService;
    private final CareerProjectService projectService;
    private final ProjectFeatureService portfolioProjectFeatureService;

    @GetMapping("/representative-careers")
    public ResponseEntity<List<RepresentativeCareerResponse>> getAll(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        List<RepresentativeCareerResponse> result = new ArrayList<>();

        careerService.getRepresentativeCareers(user).forEach(c ->
                result.add(new RepresentativeCareerResponse("CAREER", c.getRole(), c.getCompanyName(), c.getDescription()))
        );

        educationService.getRepresentativeEducations(user).forEach(e ->
                result.add(new RepresentativeCareerResponse("EDUCATION", e.getDegree(), e.getSchoolName(), e.getDescription()))
        );

        awardService.getRepresentativeAwards(user).forEach(a ->
                result.add(new RepresentativeCareerResponse("AWARD", a.getTitle(), a.getIssuer(), a.getDescription()))
        );

        projectService.getRepresentativeProjects(user).forEach(p ->
                result.add(new RepresentativeCareerResponse("PROJECT_RESUME", p.getTitle(), p.getTechStack(), p.getDescription()))
        );

        portfolioProjectFeatureService.getRepresentativeProjects(user).forEach(p ->
                result.add(new RepresentativeCareerResponse("PROJECT_PORTFOLIO", p.getTitle(), p.getTools(), p.getDescription()))
        );

        return ResponseEntity.ok(result);
    }
}
