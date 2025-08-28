package com.sandwich.SandWich.GitHubRequest.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class WorkflowFileService {

    private final RestTemplate restTemplate;

    public void createFolderIfNotExists(String token, String owner, String repo, String branch) {
        String gitkeepPath = ".github/workflows/.gitkeep";
        String emptyContentBase64 = Base64.getEncoder().encodeToString("\n".getBytes(StandardCharsets.UTF_8));
        commitFile(token, owner, repo, branch, gitkeepPath, emptyContentBase64, "Create .github/workflows folder with .gitkeep", null);
    }

    public String getFileSha(String token, String owner, String repo, String branch, String path) {
        String url = String.format("https://api.github.com/repos/%s/%s/contents/%s?ref=%s", owner, repo, path, branch);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map body = response.getBody();
            return (String) body.get("sha");
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    public void commitFile(String token, String owner, String repo, String branch,
                           String path, String contentBase64, String message, String sha) {
        String url = String.format("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        body.put("content", contentBase64);
        body.put("branch", branch);
        if (sha != null) body.put("sha", sha);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
    }

    public void commitSandwichJson(String token, String owner, String repo, String branch) {
        String jsonContent = """
            {
              "buildCommand": "mkdir -p build && echo 'dummy content' > build/index.html",
              "outputDirectory": "build"
            }
        """;
        String base64Json = Base64.getEncoder().encodeToString(jsonContent.getBytes(StandardCharsets.UTF_8));
        String sha = getFileSha(token, owner, repo, branch, ".sandwich.json");
        commitFile(token, owner, repo, branch, ".sandwich.json", base64Json, "Add .sandwich.json config file", sha);
    }
}

