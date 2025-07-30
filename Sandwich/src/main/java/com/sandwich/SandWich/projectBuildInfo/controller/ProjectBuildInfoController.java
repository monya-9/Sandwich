package com.sandwich.SandWich.projectBuildInfo.controller;

import com.sandwich.SandWich.projectBuildInfo.domain.ProjectBuildInfo;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.projectBuildInfo.service.PprojectBuildInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/build")
@RequiredArgsConstructor
public class ProjectBuildInfoController {

    private final PprojectBuildInfoService buildInfoService;

    @PostMapping("/{projectId}/git-url")
    public ResponseEntity<?> saveGitUrl(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        String gitUrl = request.get("gitUrl");
        if (gitUrl == null || gitUrl.isEmpty()) {
            return ResponseEntity.badRequest().body("gitUrl is required");
        }

        Long userId = userDetails.getUser().getId();
        ProjectBuildInfo saved = buildInfoService.saveOrUpdateBuildInfo(userId, projectId, gitUrl);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{projectId}/git-url")
    public ResponseEntity<?> getGitUrl(@PathVariable Long projectId) {
        return buildInfoService.getBuildInfo(projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
