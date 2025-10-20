package com.sandwich.SandWich.env.controller;

import com.sandwich.SandWich.GitHubRequest.service.GitHubSecretsService;
import com.sandwich.SandWich.env.domain.ProjectEnv;
import com.sandwich.SandWich.env.service.EnvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/env")
@RequiredArgsConstructor
public class EnvController {

    private final EnvService envService;
    private final GitHubSecretsService gitHubSecretsService;

    /** DB에서 프로젝트 Env 조회 */
    @GetMapping("/{projectId}")
    public List<ProjectEnv> getAll(@PathVariable Long projectId) {
        return envService.getEnvs(projectId);
    }

    /**
     * Env 추가 (DB + GitHub)
     * 헤더에 X-GitHub-Token 넣으면 GitHub에도 등록됨
     */
    @PostMapping("/add/{projectId}")
    public ResponseEntity<?> addEnv(
            @PathVariable Long projectId,
            @RequestParam String owner,
            @RequestParam String repo,
            @RequestHeader(value = "X-GitHub-Token", required = false) String gitHubToken,
            @RequestBody List<Map<String, String>> envList
    ) {
        for (Map<String, String> env : envList) {
            String key = env.get("keyName");
            String value = env.get("value");

            if (key == null || value == null) {
                return ResponseEntity.badRequest().body("keyName과 value는 필수입니다.");
            }

            envService.addEnv(projectId, key, value, gitHubToken, owner, repo);
        }

        return ResponseEntity.ok("환경변수 등록 완료 (" + envList.size() + "개)");
    }

    /** 기존 Env GitHub와 동기화 */
    @PostMapping("/sync/{projectId}")
    public ResponseEntity<?> syncWithGitHub(
            @PathVariable Long projectId,
            @RequestParam String owner,
            @RequestParam String repo,
            @RequestHeader("X-GitHub-Token") String gitHubToken
    ) {
        try {
            envService.syncWithGitHub(projectId, owner, repo, gitHubToken);
            return ResponseEntity.ok("Secrets synced successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("오류 발생: " + e.getMessage());
        }
    }

    @PostMapping("/{projectId}/env")
    public ResponseEntity<?> setProjectEnv(
            @PathVariable Long projectId,
            @RequestParam String owner,
            @RequestParam String repo,
            @RequestParam String branch,
            @RequestBody Map<String, String> envs,
            @RequestHeader("X-GitHub-Token") String gitHubToken) {

        try {
            for (Map.Entry<String, String> entry : envs.entrySet()) {
                gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, entry.getKey(), entry.getValue());
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Secrets 등록 실패: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Secrets successfully updated in GitHub"
        ));
    }
}