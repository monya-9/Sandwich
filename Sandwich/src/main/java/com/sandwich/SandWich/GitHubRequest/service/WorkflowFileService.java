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
        // Base64 인코딩된 빈 내용 (빈 파일)
        String emptyContentBase64 = Base64.getEncoder().encodeToString("\n".getBytes(StandardCharsets.UTF_8));
        String url = String.format("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, gitkeepPath);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Create .github/workflows folder with .gitkeep");
        body.put("content", emptyContentBase64);
        body.put("branch", branch);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            String response = restTemplate.exchange(url, HttpMethod.PUT, request, String.class).getBody();
            System.out.println("GitHub response: " + response);
        } catch (Exception e) {
            System.err.println("Error creating .gitkeep file: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
            // 파일이 없으면 null 리턴
            return null;
        }
    }

    public void commitSandwichJson(String token, String owner, String repo, String branch) throws Exception {
        String jsonContent = """
        {
          "buildCommand": "mkdir -p build && echo 'dummy content' > build/index.html"
        }
        """;

        String base64Json = Base64.getEncoder().encodeToString(jsonContent.getBytes(StandardCharsets.UTF_8));
        String url = String.format("https://api.github.com/repos/%s/%s/contents/.sandwich.json", owner, repo);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String sha = getFileSha(token, owner, repo, branch, ".sandwich.json");

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Add .sandwich.json config file");
        body.put("content", base64Json);
        body.put("branch", branch);
        if (sha != null) {
            body.put("sha", sha);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
    }



    public void commitDeployWorkflow(String token, String owner, String repo, String newBranchName, Long user_id, Long project_id) throws Exception {
        String workflowYaml = """
                name: Deploy Project

                on:
                  push:
                    branches:
                      - main

                env:
                  AWS_REGION: ap-northeast-2
                  S3_BUCKET: sandwich-user-projects

                jobs:
                  build-and-deploy:
                    runs-on: ubuntu-latest

                    steps:
                      - name: Checkout code
                        uses: actions/checkout@v3

                      - name: Install Node.js
                        uses: actions/setup-node@v3
                        with:
                          node-version: '18'

                      - name: Install dependencies
                        run: npm install

                      - name: Build project
                        run: npm run build

                      - name: Check current directory files
                        run: ls -la

                      - name: Check build folder contents
                        run: ls -la build || echo "build 폴더가 없습니다"

                      - name: Configure AWS credentials
                        uses: aws-actions/configure-aws-credentials@v3
                        with:
                          aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                          aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                          aws-region: ap-northeast-2

                      - name: Deploy to S3
                        run: aws s3 sync build/ s3://${{ env.S3_BUCKET }}/${{ secrets.USER_ID }}/${{ secrets.PROJECT_ID }} --acl public-read

                      - name: Invalidate CloudFront cache
                        run: |
                          aws cloudfront create-invalidation \\
                          --distribution-id ${{ secrets.SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID }} \\
                          --paths "/${{ secrets.USER_ID }}/${{ secrets.PROJECT_ID }}/*"



            """;

        String base64Workflow = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));
        String workflowUrl = String.format("https://api.github.com/repos/%s/%s/contents/.github/workflows/deploy.yml", owner, repo);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 여기서 sha 조회
        String sha = getFileSha(token, owner, repo, newBranchName, ".github/workflows/deploy.yml");

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Add GitHub Actions deploy workflow");
        body.put("content", base64Workflow);
        body.put("branch", newBranchName);
        if (sha != null) {
            body.put("sha", sha);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.exchange(workflowUrl, HttpMethod.PUT, request, String.class);

    }
}
