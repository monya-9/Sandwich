package com.sandwich.SandWich.GitHubRequest.service;


import com.sandwich.SandWich.env.domain.ProjectEnv;
import com.sandwich.SandWich.env.service.EnvService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GitHubBranchService {
    private final WorkflowFileService workflowFileService;
    private final GitHubApiService gitHubApiService;
    private final GitHubSecretsService gitHubSecretsService;
    private final DeployWorkflowService deployWorkflowService;
    private final EcrCdWorkflowService awsOidcWorkflowService;
    private final AdditionalFileService additionalFileService;

    public void createBranchWithFileAndPR(
            Long userId,
            Long projectId,
            String owner,
            String repo,
            String baseBranch,
            String newBranchName,
            String gitHubToken,
            String frontendBuildCommand,
            String backendBuildCommand,
            Map<String, String> sandwichEnv
    ) throws Exception {
        if (gitHubToken == null || gitHubToken.isEmpty()) {
            throw new IllegalArgumentException("GitHub 토큰이 전달되지 않았습니다.");
        }


        // 1. 기준 브랜치 최신 SHA 가져오기
        String baseSha = gitHubApiService.getLatestCommitSha(gitHubToken, owner, repo, baseBranch);

        // 2. 새 브랜치 생성
        gitHubApiService.createBranch(gitHubToken, owner, repo, newBranchName, baseSha);

        // 3. workflows 커밋 / .sandwich.json 생성 및 커밋
        workflowFileService.commitSandwichJson(gitHubToken, owner, repo, newBranchName,
                frontendBuildCommand, backendBuildCommand);
        workflowFileService.createFolderIfNotExists(gitHubToken, owner, repo, newBranchName);

        // 4. 배포 워크플로우 커밋
        List<String> additionalFiles = additionalFileService.getS3KeysByUserAndProject(userId, projectId);
        deployWorkflowService.commitDeployWorkflow(gitHubToken, owner, repo, newBranchName, sandwichEnv, additionalFiles);

        // 5. GitHub Secrets 자동 등록
        String awsRoleArn = System.getenv("AWS_ROLE_ARN");
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "AWS_ROLE_ARN", awsRoleArn);
        awsOidcWorkflowService.commitOidcFullCdWorkflow(gitHubToken, owner, repo, newBranchName, awsRoleArn);

        String awsAccessKey = System.getenv("SANDWICH_USER_AWS_ACCESS_KEY_ID");
        String awsSecretKey = System.getenv("SANDWICH_USER_AWS_SECRET_ACCESS_KEY");

        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_AWS_ACCESS_KEY_ID", awsAccessKey);
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_AWS_SECRET_ACCESS_KEY", awsSecretKey);

        String cloudFrontDistributionId = System.getenv("SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID");
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID", cloudFrontDistributionId);

        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "USER_ID", userId.toString());
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "PROJECT_ID", projectId.toString());

        // 6. PR 생성
        gitHubApiService.createPullRequest(gitHubToken, owner, repo, newBranchName, baseBranch);

    }
}
