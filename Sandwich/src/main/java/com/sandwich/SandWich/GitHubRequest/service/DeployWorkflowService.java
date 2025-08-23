package com.sandwich.SandWich.GitHubRequest.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;


@Service
public class DeployWorkflowService {
    private final WorkflowFileService workflowFileService;

    public DeployWorkflowService(WorkflowFileService workflowFileService) {
        this.workflowFileService = workflowFileService;
    }

    public void commitDeployWorkflow(String token, String owner, String repo, String newBranchName, Long user_id, Long project_id) throws Exception {
        String workflowYaml = """
                name: Deploy Project

                on:
                  workflow_run:
                    workflows: ["Create CodePipeline"]
                    types:
                      - completed

                env:
                  AWS_REGION: ap-northeast-2
                  S3_BUCKET: sandwich-user-projects
                  USER_ID: ${{ secrets.USER_ID }}
                  PROJECT_ID: ${{ secrets.PROJECT_ID }}
                  PIPELINE_NAME: "sandwich-${{ secrets.USER_ID }}-${{ secrets.PROJECT_ID }}-pipeline"

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

                      - name: Login to Amazon ECR
                        uses: aws-actions/amazon-ecr-login@v2
          
                      - name: Create ECR repository if not exists
                        run: |
                          aws ecr describe-repositories --repository-names "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}" || \\
                          aws ecr create-repository --repository-name "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}"

                      - name: Build and Push Docker image
                        run: |
                          if [ -f Dockerfile ]; then
                            IMAGE_TAG=${GITHUB_SHA}
                            ECR_URI=398808282696.dkr.ecr.ap-northeast-2.amazonaws.com/sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}
                            docker build -t $ECR_URI:$IMAGE_TAG .
                            docker push $ECR_URI:$IMAGE_TAG
                          else
                            echo "No Dockerfile, skipping Docker build"
                          fi

                      - name: Deploy to S3
                        run: aws s3 sync build/ s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }} --acl public-read

                      - name: Invalidate CloudFront cache
                        run: |
                          aws cloudfront create-invalidation \\
                          --distribution-id ${{ secrets.SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID }} \\
                          --paths "/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/*"

                      - name: Trigger CodePipeline
                        run: |
                          aws codepipeline start-pipeline-execution --name ${{ env.PIPELINE_NAME }}


            """;

        String base64 = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));
        String sha = workflowFileService.getFileSha(token, owner, repo, newBranchName, ".github/workflows/deploy.yml");
        workflowFileService.commitFile(token, owner, repo, newBranchName,
                ".github/workflows/deploy.yml", base64, "Add deploy workflow", sha);

    }
}
