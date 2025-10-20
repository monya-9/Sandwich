package com.sandwich.SandWich.env.service;

import com.sandwich.SandWich.env.domain.ProjectEnv;
import com.sandwich.SandWich.env.repository.ProjectEnvRepository;
import com.sandwich.SandWich.env.util.EncryptionUtil;
import com.sandwich.SandWich.GitHubRequest.service.GitHubSecretsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnvService {

    private final ProjectEnvRepository envRepository;
    private final GitHubSecretsService gitHubSecretsService;
    private final EncryptionUtil encryptionUtil;

    /** DB 조회 */
    public List<ProjectEnv> getEnvs(Long projectId) {
        return envRepository.findByProjectId(projectId);
    }

    /** Env 추가 + GitHub 등록 */
    public ProjectEnv addEnv(Long projectId, String key, String value,
                             String gitHubToken, String owner, String repo) {

        String encryptedValue = encryptionUtil.encrypt(value);

        ProjectEnv env = ProjectEnv.builder()
                .projectId(projectId)
                .keyName(key)
                .valueEncrypted(encryptedValue)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // DB 저장
        ProjectEnv savedEnv = envRepository.save(env);

        // GitHub 등록
        if (gitHubToken != null && !gitHubToken.isEmpty() &&
                owner != null && repo != null) {
            if (!gitHubSecretsService.isTokenValid(gitHubToken)) {
                throw new IllegalArgumentException("GitHub 토큰이 유효하지 않습니다.");
            }
            try {
                gitHubSecretsService.createOrUpdateSecretWebClient(
                        gitHubToken, owner, repo, key, value
                );
            } catch (Exception e) {
                throw new RuntimeException("GitHub Secrets 등록 실패: " + e.getMessage(), e);
            }
        }

        return savedEnv;
    }

    /** GitHub 동기화 */
    public void syncWithGitHub(Long projectId, String owner, String repo, String gitHubToken) {
        if (!gitHubSecretsService.isTokenValid(gitHubToken)) {
            throw new IllegalArgumentException("GitHub 토큰이 유효하지 않습니다.");
        }

        List<ProjectEnv> envs = envRepository.findByProjectId(projectId);
        envs.forEach(env -> {
            String decryptedValue = encryptionUtil.decrypt(env.getValueEncrypted());

            try {
                gitHubSecretsService.createOrUpdateSecretWebClient(
                        gitHubToken, owner, repo, env.getKeyName(), decryptedValue
                );
            } catch (Exception e) {
                throw new RuntimeException(
                        "GitHub Secrets 동기화 실패: key=" + env.getKeyName(), e
                );
            }

            // 동기화 후 DB 업데이트 시간만 변경
            env.setUpdatedAt(LocalDateTime.now());
            envRepository.save(env);
        });
    }
}
