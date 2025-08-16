package com.sandwich.SandWich.GitHubRequest.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ProvisionEcsWorkflowService {
    private final WorkflowFileService workflowFileService;

    public ProvisionEcsWorkflowService(WorkflowFileService workflowFileService) {
        this.workflowFileService = workflowFileService;
    }

    public void commitProvisionWorkflow(String token, String owner, String repo, String newBranchName) {
        String ProvisionworkflowYaml = """
            name: Provision ECS

            on:
              push:
                branches:
                  - main

            jobs:
              provision:
                runs-on: ubuntu-latest
                steps:
                  - name: Checkout
                    uses: actions/checkout@v3

                  - name: Configure AWS credentials
                    uses: aws-actions/configure-aws-credentials@v3
                    with:
                      aws-access-key-id: ${{ secrets.SANDWICH_USER_AWS_ACCESS_KEY_ID }}
                      aws-secret-access-key: ${{ secrets.SANDWICH_USER_AWS_SECRET_ACCESS_KEY }}
                      aws-region: ap-northeast-2

                  - name: Create ECS Cluster
                    run: |
                      aws ecs create-cluster --cluster-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} || true

                  - name: Register Task Definition
                    run: |
                      cat <<EOF > taskdef.json
                      {
                        "family": "sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }}",
                        "networkMode": "awsvpc",
                        "requiresCompatibilities": ["FARGATE"],
                        "cpu": "256",
                        "memory": "512",
                        "containerDefinitions": [
                          {
                            "name": "app",
                            "image": "public.ecr.aws/amazonlinux/amazonlinux:latest",
                            "essential": true,
                            "portMappings": [
                              {
                                "containerPort": 80,
                                "protocol": "tcp"
                              }
                            ]
                          }
                        ]
                      }
                      EOF
                      aws ecs register-task-definition --cli-input-json file://taskdef.json

                  - name: Create ECS Service
                    run: |
                      aws ecs create-service \
                        --cluster sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --service-name sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --task-definition sandwich-${{ github.repository_owner }}-${{ github.event.repository.name }} \
                        --desired-count 1 \
                        --launch-type FARGATE \
                        --network-configuration "awsvpcConfiguration={subnets=[subnet-0c63ddf51361003c7],securityGroups=[sg-05757f4e3849d99cf],assignPublicIp=ENABLED}" || true
            """;

        String base64 = Base64.getEncoder().encodeToString(ProvisionworkflowYaml.getBytes(StandardCharsets.UTF_8));
        String sha = workflowFileService.getFileSha(token, owner, repo, newBranchName, ".github/workflows/provision-ecs.yml");
        workflowFileService.commitFile(token, owner, repo, newBranchName,
                ".github/workflows/provision-ecs.yml", base64, "Add provision ECS workflow", sha);
    }
}
