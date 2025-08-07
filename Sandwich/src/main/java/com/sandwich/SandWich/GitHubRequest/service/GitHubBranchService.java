package com.sandwich.SandWich.GitHubRequest.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GitHubBranchService {
    private final WorkflowFileService workflowFileService;
    private final GitHubApiService gitHubApiService;
    private final GitHubSecretsService gitHubSecretsService;

    public void createBranchWithFileAndPR(Long userId, Long projectId, String owner, String repo, String baseBranch, String newBranchName, String gitHubToken) throws Exception {
        if (gitHubToken == null || gitHubToken.isEmpty()) {
            throw new IllegalArgumentException("GitHub 토큰이 전달되지 않았습니다.");
        }


        // 1. 기준 브랜치 최신 SHA 가져오기
        String baseSha = gitHubApiService.getLatestCommitSha(gitHubToken, owner, repo, baseBranch);

        // 2. 새 브랜치 생성
        gitHubApiService.createBranch(gitHubToken, owner, repo, newBranchName, baseSha);

        // 3. workflows 커밋
        // 3. .github/workflows 폴더 없으면 생성 (빈 .gitkeep 커밋)
        workflowFileService.createFolderIfNotExists(gitHubToken, owner, repo, newBranchName);
        workflowFileService.commitDeployWorkflow(gitHubToken, owner, repo, newBranchName, userId, projectId);
        // .sandwich.json 생성 및 커밋
        workflowFileService.commitSandwichJson(gitHubToken, owner, repo, newBranchName);

        // 4. PR 생성
        gitHubApiService.createPullRequest(gitHubToken, owner, repo, newBranchName, baseBranch);

        // 5. GitHub Secrets 자동 등록
        String awsAccessKey = System.getenv("SANDWICH_USER_AWS_ACCESS_KEY_ID");
        String awsSecretKey = System.getenv("SANDWICH_USER_AWS_SECRET_ACCESS_KEY");

        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_AWS_ACCESS_KEY_ID", awsAccessKey);
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_AWS_SECRET_ACCESS_KEY", awsSecretKey);

        // 6. SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID 자동 등록
        String cloudFrontDistributionId = System.getenv("SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID");
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "SANDWICH_USER_CLOUDFRONT_DISTRIBUTION_ID", cloudFrontDistributionId);

        // 7. user_id, poject_id 삽입
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "USER_ID", userId.toString());
        gitHubSecretsService.createOrUpdateSecret(gitHubToken, owner, repo, "PROJECT_ID", projectId.toString());

    }
}
