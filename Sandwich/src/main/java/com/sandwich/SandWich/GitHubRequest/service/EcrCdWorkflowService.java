package com.sandwich.SandWich.GitHubRequest.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class EcrCdWorkflowService {

    private final WorkflowFileService workflowFileService;

    public void commitOidcFullCdWorkflow(String token, String owner, String repo, String branch, String roleArn) {
        String workflowYaml = """
                name: Sandwich ECR Full CD

                on:
                  workflow_run:
                    workflows: ["Deploy Project"]
                    types:
                      - completed

                env:
                  AWS_REGION: ap-northeast-2
                  USER_ID: ${{ secrets.USER_ID }}
                  PROJECT_ID: ${{ secrets.PROJECT_ID }}
                  PIPELINE_NAME: "sandwich-${{ secrets.USER_ID }}-${{ secrets.PROJECT_ID }}-pipeline"

                jobs:
                  # 1. ECS 클러스터/서비스 생성 (필요시)
                  provision-ecs:
                    runs-on: ubuntu-latest
                    steps:
                      - name: Checkout
                        uses: actions/checkout@v3

                      - name: Configure AWS credentials
                        uses: aws-actions/configure-aws-credentials@v3
                        with:
                          aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                          aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                          aws-region: ${{ env.AWS_REGION }}

                      - name: ECS Provisioning
                        run: echo "ECS 클러스터/서비스 생성 스크립트 실행"

                  # 2. CodePipeline 생성 (ECR Source 기반)
                  create-codepipeline:
                    needs: provision-ecs
                    runs-on: ubuntu-latest
                    steps:
                      - name: Checkout
                        uses: actions/checkout@v3

                      - name: Configure AWS credentials
                        uses: aws-actions/configure-aws-credentials@v3
                        with:
                          aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                          aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                          aws-region: ${{ env.AWS_REGION }}

                      - name: Create ECR-based CodePipeline
                        run: echo "ECR Source + ECS Deploy 파이프라인 생성"

                  # 3. 배포 (Docker build, ECR push, S3 sync, CloudFront invalidation)
                  deploy:
                    needs: create-codepipeline
                    runs-on: ubuntu-latest
                    steps:
                      - name: Checkout
                        uses: actions/checkout@v3

                      - name: Configure AWS credentials
                        uses: aws-actions/configure-aws-credentials@v3
                        with:
                          aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                          aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                          aws-region: ${{ env.AWS_REGION }}

                      - name: Build & Deploy
                        run: echo "Docker 빌드 → ECR push → S3 sync → CloudFront invalidation"
            """;

        String base64 = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));

        String sha = workflowFileService.getFileSha(token, owner, repo, branch, ".github/workflows/ecr-full-cd.yml");
        workflowFileService.commitFile(token, owner, repo, branch,
                ".github/workflows/ecr-full-cd.yml", base64, "Add ECR full CD workflow", sha);
    }
}
