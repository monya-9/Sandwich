package com.sandwich.SandWich.GitHubRequest.controller;

import com.sandwich.SandWich.GitHubRequest.dto.GitHubTokenRequest;
import com.sandwich.SandWich.GitHubRequest.service.GitHubTokenService;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GitHubTokenController {

    private final GitHubTokenService gitHubTokenService;

    @PostMapping("/{projectId}/token")
    public ResponseEntity<?> saveToken(
            @PathVariable Long projectId,
            @RequestBody GitHubTokenRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        if (request.getToken() == null || request.getToken().isEmpty()) {
            return ResponseEntity.badRequest().body("토큰을 입력해 주세요.");
        }

        boolean valid = gitHubTokenService.isTokenValid(request.getToken());
        if (!valid) {
            return ResponseEntity.badRequest().body("유효한 토큰이 아닙니다.");
        }

        Long userId = userDetails.getUser().getId();
        gitHubTokenService.saveToken(userId, projectId, request.getToken());

        return ResponseEntity.ok("GitHub 토큰이 성공적으로 저장되었습니다.");
    }

    @GetMapping("/{projectId}/latest-sha")
    public ResponseEntity<String> getLatestSha(
            @PathVariable Long projectId,
            @RequestParam String owner,
            @RequestParam String repo,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        Long userId = userDetails.getUser().getId();
        String branch = "main";
        String sha = gitHubTokenService.getLatestCommitSha(userId, projectId, owner, repo, branch);
        return ResponseEntity.ok(sha);
    }

}
