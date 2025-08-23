package com.sandwich.SandWich.GitHubRequest.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class CreateCodePipelineService {
    private final WorkflowFileService workflowFileService;

    public CreateCodePipelineService(WorkflowFileService workflowFileService) {
        this.workflowFileService = workflowFileService;
    }

    public void commitPipelineWorkflow(String token, String owner, String repo, String branch) {
        String workflowYaml = """
            name: Create CodePipeline

            on:
              workflow_run:
                workflows: ["Provision ECS"]
                types:
                  - completed

            env:
              AWS_REGION: ap-northeast-2
              USER_ID: ${{ secrets.USER_ID }}
              PROJECT_ID: ${{ secrets.PROJECT_ID }}
              PIPELINE_NAME: "sandwich-${{ secrets.USER_ID }}-${{ secrets.PROJECT_ID }}-pipeline"

            jobs:
              create-pipeline:
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

                  - name: Create CodePipeline
                    run: |
                      aws codepipeline create-pipeline --cli-input-json '{
                        "pipeline": {
                          "name": "${{ env.PIPELINE_NAME }}",
                          "roleArn": "arn:aws:iam::398808282696:role/CodePipelineServiceRole",
                          "artifactStore": {
                            "type": "S3",
                            "location": "sandwich-user-projects"
                          },
                          "stages": [
                            {
                              "name": "Source",
                              "actions": [
                                {
                                  "name": "Source",
                                  "actionTypeId": {
                                    "category": "Source",
                                    "owner": "ThirdParty",
                                    "provider": "GitHub",
                                    "version": "1"
                                  },
                                  "outputArtifacts": [{"name": "SourceOutput"}],
                                  "configuration": {
                                    "Owner": "%s",
                                    "Repo": "%s",
                                    "Branch": "%s",
                                    "OAuthToken": "${{ secrets.GITHUB_TOKEN }}"
                                  },
                                  "runOrder": 1
                                }
                              ]
                            },
                            {
                              "name": "Deploy",
                              "actions": [
                                {
                                  "name": "Deploy",
                                  "actionTypeId": {
                                    "category": "Deploy",
                                    "owner": "AWS",
                                    "provider": "S3",
                                    "version": "1"
                                  },
                                  "inputArtifacts": [{"name": "SourceOutput"}],
                                  "configuration": {
                                    "BucketName": "sandwich-user-projects",
                                    "Extract": "true"
                                  },
                                  "runOrder": 1
                                }
                              ]
                            }
                          ]
                        }
                      }'
        """.formatted(owner, repo, branch);

        String base64 = Base64.getEncoder().encodeToString(workflowYaml.getBytes(StandardCharsets.UTF_8));
        String sha = workflowFileService.getFileSha(token, owner, repo, branch, ".github/workflows/create-codepipeline.yml");

        workflowFileService.commitFile(token, owner, repo, branch,
                ".github/workflows/create-codepipeline.yml", base64, "Add create codepipeline workflow", sha);
    }
}
