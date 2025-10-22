package com.sandwich.SandWich.representative.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.career.service.CareerService;
import com.sandwich.SandWich.careerProject.service.CareerProjectService;
import com.sandwich.SandWich.common.dto.IdListRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class RepresentativeCareerMutateController {

    private final CareerService careerService;
    private final CareerProjectService careerProjectService;

    /** 커리어 대표: ids 전체 교체 (빈 배열 → 전부 해제) */
    @PatchMapping("/representative-careers")
    public ResponseEntity<?> setRepresentativeCareers(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestBody IdListRequest req
    ) {
        careerService.setRepresentativeCareers(me.getId(), req.ids());
        String msg = (req.ids() == null || req.ids().isEmpty())
                ? "대표 커리어 해제 완료"
                : "대표 커리어 설정 완료";
        return ResponseEntity.ok(msg);
    }

    /** 이력 프로젝트 대표: ids 전체 교체 (빈 배열 → 전부 해제) */
    @PatchMapping("/representative-projects")
    public ResponseEntity<?> setRepresentativeCareerProjects(
            @AuthenticationPrincipal UserDetailsImpl me,
            @RequestBody IdListRequest req
    ) {
        careerProjectService.setRepresentativeProjects(me.getId(), req.ids());
        String msg = (req.ids() == null || req.ids().isEmpty())
                ? "대표 프로젝트(이력) 해제 완료"
                : "대표 프로젝트(이력) 설정 완료";
        return ResponseEntity.ok(msg);
    }
}
