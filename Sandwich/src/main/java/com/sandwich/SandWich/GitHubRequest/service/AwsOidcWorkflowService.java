package com.sandwich.SandWich.GitHubRequest.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AwsOidcWorkflowService {

    private final WorkflowFileService workflowFileService;

    public void commitOidcFullCdWorkflow(String token, String owner, String repo, String branch, String roleArn) {
        String workflowYaml = """
            name: Sandwich Full CD (OIDC)

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

            permissions:
              id-token: write
              contents: read

            jobs:
              provision-ecs:
                runs-on: ubuntu-latest
                steps:
                  - name: Checkout
                    uses: actions/checkout@v3

                  - name: Configure AWS credentials via OIDC
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      role-to-assume: "${{ secrets.AWS_ROLE_ARN }}"
                      aws-region: ${{ env.AWS_REGION }}

                  # ECS 클러스터, 서비스, Task 정의 생성
                  - name: Provision ECS
                    run: echo "ECS provisioning steps here"

              create-codepipeline:
                needs: provision-ecs
                runs-on: ubuntu-latest
                steps:
                  - name: Checkout
                    uses: actions/checkout@v3

                  - name: Configure AWS credentials via OIDC
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      role-to-assume: "${{ secrets.AWS_ROLE_ARN }}"
                      aws-region: ${{ env.AWS_REGION }}

                  - name: Create CodePipeline
                    run: echo "CodePipeline creation steps here"

              deploy:
                needs: create-codepipeline
                runs-on: ubuntu-latest
                steps:
                  - name: Checkout
                    uses: actions/checkout@v3

                  - name: Configure AWS credentials via OIDC
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      role-to-assume: "${{ secrets.AWS_ROLE_ARN }}"
                      aws-region: ${{ env.AWS_REGION }}

                  - name: Build & Deploy
                    run: echo "Build, push to ECR, S3 sync, CloudFront invalidation"
            """;

        String base64 = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));

        String sha = workflowFileService.getFileSha(token, owner, repo, branch, ".github/workflows/oidc-full-cd.yml");
        workflowFileService.commitFile(token, owner, repo, branch,
                ".github/workflows/oidc-full-cd.yml", base64, "Add OIDC full CD workflow", sha);
    }
}
