package com.sandwich.SandWich.GitHubRequest.controller;

import com.sandwich.SandWich.GitHubRequest.service.GitHubBranchService;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GitHubBranchController {
    public static final String DEFAULT_NEW_BRANCH_NAME = "sandwich-created-branch";

    private final GitHubBranchService gitHubBranchService;

    @PostMapping("/{projectId}/branches-with-file-and-pr")
    public ResponseEntity<String> createBranchWithFileAndPR(
            @PathVariable Long projectId,
            @RequestParam String owner,
            @RequestParam String repo,
            @RequestParam String baseBranch,
            @RequestParam String frontendBuildCommand,
            @RequestParam String backendBuildCommand,
            @RequestHeader("X-GitHub-Token") String gitHubToken,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Long userId = userDetails.getUser().getId();

        try {
            Map<String, String> sandwichEnv = Collections.emptyMap();

            gitHubBranchService.createBranchWithFileAndPR(
                    userId, projectId, owner, repo, baseBranch, DEFAULT_NEW_BRANCH_NAME,
                    gitHubToken, frontendBuildCommand, backendBuildCommand, sandwichEnv
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body("오류 발생: " + e.getMessage());
        }

        return ResponseEntity.ok("새 브랜치, .sandwich.json 파일 생성 및 PR이 성공적으로 완료되었습니다.");
    }


}
