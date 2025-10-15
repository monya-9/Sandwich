package com.sandwich.SandWich.GitHubRequest.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;


@Service
public class DeployWorkflowService {
    private final WorkflowFileService workflowFileService;

    public DeployWorkflowService(WorkflowFileService workflowFileService) {
        this.workflowFileService = workflowFileService;
    }

    public void commitDeployWorkflow(String token, String owner, String repo, String newBranchName,
                                     Map<String, String> sandwichEnv, List<String> additionalFiles) throws Exception {

        // 1. env 섹션 생성 (Secrets에서 가져오기만 하면 됨)
        StringBuilder envSection = new StringBuilder("env:\n");
        if (sandwichEnv != null) {
            sandwichEnv.keySet().forEach(key -> {
                envSection.append("  ")
                        .append(key)
                        .append(": ${{ secrets.")
                        .append(key)
                        .append(" }}\n");
            });
        }

        // 2. 추가 파일 다운로드 Step 생성
        StringBuilder additionalFilesStep = new StringBuilder();
        if (additionalFiles != null && !additionalFiles.isEmpty()) {
            additionalFilesStep.append("      - name: Download additional files\n")
                    .append("        run: |\n")
                    .append("          mkdir -p additional\n");
            for (String file : additionalFiles) {
                additionalFilesStep.append("          aws s3 cp s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/")
                        .append(file)
                        .append(" additional/")
                        .append(file)
                        .append("\n");
            }
        }

        // 3. workflow YAML 생성
        String workflowYaml = """
            name: Deploy Project
            
            on:
              push:
                branches:
                  - main
            
            env:
              AWS_REGION: ap-northeast-2
              S3_BUCKET: sandwich-user-projects
              USER_ID: ${{ secrets.USER_ID }}
              PROJECT_ID: ${{ secrets.PROJECT_ID }}
              ECS_CONTAINER_NAME: "app-container"
            
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
            
                  - name: Check build folder contents
                    run: ls -la build || echo "build 폴더가 없습니다"
            
                  - name: Configure AWS credentials
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                      aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                      aws-region: ${{ env.AWS_REGION }}

                  - name: Download additional files from S3
                    run: |
                      ADDITIONAL_FILES=(
                        $(aws s3 ls s3://sandwich-user-projects/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/deploy/ --recursive | awk '{print $4}')
                      )
                      mkdir -p additional
                      for file in "${ADDITIONAL_FILES[@]}"; do
                        echo "Downloading $file..."
                        aws s3 cp s3://sandwich-user-projects/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/deploy/$file additional/$file
                      done

                  - name: Create ECS Cluster
                    run: |
                      aws ecs create-cluster --cluster-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} || true
            
                  - name: Create ECS Service
                    run: |
                      aws ecs create-service \\
                        --cluster sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \\
                        --service-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \\
                        --task-definition sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \\
                        --desired-count 1 \\
                        --launch-type FARGATE \\
                        --network-configuration "awsvpcConfiguration={subnets=[subnet-0c63ddf51361003c7],securityGroups=[sg-05757f4e3849d99cf],assignPublicIp=ENABLED}" || true
            
                  - name: Login to Amazon ECR
                    uses: aws-actions/amazon-ecr-login@v2
            
                  - name: Create ECR repository if not exists
                    run: |
                      aws ecr describe-repositories --repository-names "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}" || \
                      aws ecr create-repository --repository-name "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}"
            
                  - name: Build and Push Docker image
                    run: |
                      if [ -f Dockerfile ]; then
                        IMAGE_TAG=${GITHUB_SHA}
                        ECR_URI=398808282696.dkr.ecr.ap-northeast-2.amazonaws.com/sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}
                        docker build -t $ECR_URI:$IMAGE_TAG .
                        docker push $ECR_URI:$IMAGE_TAG
                        docker tag $ECR_URI:$IMAGE_TAG $ECR_URI:latest
                        docker push $ECR_URI:latest
                        echo "[{\\"name\\": \\"${{ env.ECS_CONTAINER_NAME }}\\", \\"imageUri\\": \\"$ECR_URI:$IMAGE_TAG\\"}]" > imagedefinitions.json
                      else
                        echo "No Dockerfile, skipping Docker build"
                      fi
            
                  - name: Deploy to S3
                    run: aws s3 sync build/ s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }} --acl public-read
            
                  - name: Invalidate CloudFront cache
                    run: |
                      aws cloudfront create-invalidation \
                      --distribution-id ${{ secrets.SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID }} \
                      --paths "/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/*"
            """;

        // 4. Base64 인코딩 후 커밋
        String base64 = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));
        String sha = workflowFileService.getFileSha(token, owner, repo, newBranchName, ".github/workflows/deploy.yml");
        workflowFileService.commitFile(token, owner, repo, newBranchName,
                ".github/workflows/deploy.yml", base64, "Add deploy workflow", sha);

    }
}
