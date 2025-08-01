package com.sandwich.SandWich.GitHubRequest.service;

import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
@RequiredArgsConstructor
public class GitHubApiService {

    private final RestTemplate restTemplate;

    public String getLatestCommitSha(String token, String owner, String repo, String branch) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(MediaType.parseMediaTypes("application/vnd.github+json"));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = String.format("https://api.github.com/repos/%s/%s/branches/%s", owner, repo, branch);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("GitHub API 호출 실패: " + response.getStatusCode());
        }

        try {
            JSONObject json = new JSONObject(response.getBody());
            return json.getJSONObject("commit").getString("sha");
        } catch (Exception e) {
            throw new RuntimeException("SHA 파싱 실패", e);
        }
    }

    public void createBranch(String token, String owner, String repo, String newBranchName, String baseSha) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes("application/vnd.github+json"));

        // 새 브랜치 생성용 JSON 바디
        JSONObject body = new JSONObject();
        body.put("ref", "refs/heads/" + newBranchName);  // refs/heads/브랜치명 형식으로 넣어야 함
        body.put("sha", baseSha);  // 기준이 되는 커밋 SHA

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        String url = String.format("https://api.github.com/repos/%s/%s/git/refs", owner, repo);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("GitHub 브랜치 생성 실패: " + response.getStatusCode() + " - " + response.getBody());
        }
    }

    public void createPullRequest(String token, String owner, String repo, String headBranch, String baseBranch) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes("application/vnd.github+json"));

        JSONObject body = new JSONObject();
        body.put("title", "Add .sandwich.json and initial setup");
        body.put("head", headBranch);
        body.put("base", baseBranch);
        body.put("body", "자동 생성된 PR: 새로운 브랜치 및 .sandwich.json 파일 추가");

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        String url = String.format("https://api.github.com/repos/%s/%s/pulls", owner, repo);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("GitHub PR 생성 실패: " + response.getStatusCode() + " - " + response.getBody());
        }
    }

}
