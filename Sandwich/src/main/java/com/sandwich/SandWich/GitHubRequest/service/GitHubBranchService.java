package com.sandwich.SandWich.GitHubRequest.service;


import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class GitHubBranchService {
    private final GitHubTokenService gitHubTokenService;
    private final GitHubApiService gitHubApiService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void createBranchWithFileAndPR(Long userId, Long projectId, String owner, String repo, String baseBranch, String newBranchName) throws Exception {
        String token = gitHubTokenService.getDecryptedToken(userId, projectId);
        if (token == null) {
            throw new IllegalStateException("토큰이 존재하지 않습니다.");
        }

        // 1. 기준 브랜치 최신 SHA 가져오기
        String baseSha = gitHubApiService.getLatestCommitSha(token, owner, repo, baseBranch);

        // 2. 새 브랜치 생성
        gitHubApiService.createBranch(token, owner, repo, newBranchName, baseSha);

        // 3. .sandwich.json 생성 및 커밋
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("createdBy", "sandwich");
        jsonMap.put("projectId", projectId);
        jsonMap.put("createdAt", Instant.now().toString());

        String jsonContent = objectMapper.writeValueAsString(jsonMap);
        String base64Content = Base64.getEncoder().encodeToString(jsonContent.getBytes(StandardCharsets.UTF_8));

        String url = String.format("https://api.github.com/repos/%s/%s/contents/.sandwich.json", owner, repo);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Add .sandwich.json file for Sandwich project initialization");
        body.put("content", base64Content);
        body.put("branch", newBranchName);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.exchange(url, HttpMethod.PUT, request, String.class);

        // 4. PR 생성
        gitHubApiService.createPullRequest(token, owner, repo, newBranchName, baseBranch);
    }
}
