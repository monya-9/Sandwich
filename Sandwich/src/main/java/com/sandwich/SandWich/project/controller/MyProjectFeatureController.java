package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.common.dto.IdListRequest;
import com.sandwich.SandWich.project.service.ProjectFeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class MyProjectFeatureController {

    private final ProjectFeatureService service;

    /** 포트폴리오 Project 대표: ids 전체 교체 (빈 배열 → 전부 해제) */
    @PatchMapping("/representative-portfolio-projects")
    public ResponseEntity<?> setRepresentativePortfolioProjects(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestBody IdListRequest req
    ) {
        service.setRepresentativeProjects(me.getId(), req.ids());
        return ResponseEntity.ok("대표 포트폴리오 프로젝트 설정 완료");
    }
}
