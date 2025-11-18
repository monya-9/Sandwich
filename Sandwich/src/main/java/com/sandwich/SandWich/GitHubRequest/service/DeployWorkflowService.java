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

                  # package.json이 있을 경우만 install + build 수행
                  - name: Build (if needed)
                    run: |
                      if [ -f package.json ]; then
                        echo "package.json found — installing dependencies..."
        
                        # lockfile이 있으면 npm ci, 없으면 npm install
                        if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
                          echo "Lockfile found — running npm ci..."
                          npm ci
                        else
                          echo "No lockfile found — running npm install instead of npm ci..."
                          npm install
                        fi
        
                        # build 스크립트 있으면 빌드 실행
                        if npm run | grep -q " build"; then
                          echo "build script detected — running npm run build..."
                          npm run build || true
                        else
                          echo "No build script found — skipping build."
                        fi
                      else
                        echo "No package.json found — skipping frontend build."
                      fi

                  # build / dist / out 중 존재하는 폴더 자동 탐색
                  - name: Pick deploy dir (build/dist/out or .)
                    id: pick
                    run: |
                      for d in build dist out; do
                        if [ -d "$d" ]; then
                          echo "dir=$d" >> $GITHUB_OUTPUT
                          echo "Detected deploy dir: $d"
                          exit 0
                        fi
                      done
                      echo "dir=." >> $GITHUB_OUTPUT
                      echo "No build/dist/out found, deploying repository root (static files)."

                  - name: Configure AWS credentials
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                      aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                      aws-region: ${{ env.AWS_REGION }}

                  - name: Download additional files from S3
                    run: |
                      mkdir -p additional
                      aws s3 sync "s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/deploy/" additional/ || true

                  - name: Create ECS Cluster
                    run: |
                      aws ecs create-cluster --cluster-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} || true

                  - name: Create ECS Service
                    run: |
                      aws ecs create-service \
                        --cluster sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --service-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --task-definition sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --desired-count 1 \
                        --launch-type FARGATE \
                        --network-configuration "awsvpcConfiguration={subnets=[subnet-0c63ddf51361003c7],securityGroups=[sg-05757f4e3849d99cf],assignPublicIp=ENABLED}" || true

                  - name: Login to Amazon ECR
                    uses: aws-actions/amazon-ecr-login@v2

                  - name: Create ECR repository if not exists
                    run: |
                      aws ecr describe-repositories --repository-names "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}" || \
                      aws ecr create-repository --repository-name "sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}"

                  - name: Build and Push Docker image (only if Dockerfile exists)
                    run: |
                      if [ -f Dockerfile ]; then
                        echo "Dockerfile found — building image..."
                        IMAGE_TAG=${GITHUB_SHA}
                        ECR_URI=398808282696.dkr.ecr.ap-northeast-2.amazonaws.com/sandwich-user-projects/${{ env.USER_ID }}-${{ env.PROJECT_ID }}
                        docker build -t $ECR_URI:$IMAGE_TAG .
                        docker push $ECR_URI:$IMAGE_TAG
                        docker tag $ECR_URI:$IMAGE_TAG $ECR_URI:latest
                        docker push $ECR_URI:latest
                        echo "[{\\"name\\": \\"${{ env.ECS_CONTAINER_NAME }}\\", \\"imageUri\\": \\"$ECR_URI:$IMAGE_TAG\\"}]" > imagedefinitions.json
                      else
                        echo "No Dockerfile found — skipping Docker build."
                      fi

                  - name: Deploy to S3
                    run: |
                      SRC="${{ steps.pick.outputs.dir }}"
                      if [ "$SRC" = "." ]; then
                        echo "Deploying repository root to S3..."
                        aws s3 sync . "s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/" \
                          --exclude ".git/*" --exclude ".github/*" --exclude "node_modules/*"
                      else
                        echo "Deploying $SRC folder to S3..."
                        aws s3 sync "$SRC/" "s3://${{ env.S3_BUCKET }}/${{ env.USER_ID }}/${{ env.PROJECT_ID }}/" --delete
                      fi

                  - name: Invalidate CloudFront cache
                    run: |
                      echo "Invalidating CloudFront cache..."
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
