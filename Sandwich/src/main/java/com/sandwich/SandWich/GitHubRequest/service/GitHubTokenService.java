package com.sandwich.SandWich.GitHubRequest.service;

import com.sandwich.SandWich.GitHubRequest.domain.UserGitHubToken;
import com.sandwich.SandWich.GitHubRequest.repository.GitHubTokenRepository;
import lombok.RequiredArgsConstructor;
import org.jasypt.util.text.AES256TextEncryptor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;


@Service
@RequiredArgsConstructor
public class GitHubTokenService {

    private final GitHubTokenRepository gitHubTokenRepository;
    private final AES256TextEncryptor textEncryptor;
    private final RestTemplate restTemplate;
    private final GitHubApiService gitHubApiService;

    public void saveToken(Long userId, Long projectId, String plainToken) {
        String encryptedToken = textEncryptor.encrypt(plainToken);

        UserGitHubToken entity = gitHubTokenRepository.findByUserIdAndProjectId(userId, projectId)
                .orElse(new UserGitHubToken(userId, projectId));

        entity.setEncryptedToken(encryptedToken);
        gitHubTokenRepository.save(entity);
    }

    public String getDecryptedToken(Long userId, Long projectId) {
        return gitHubTokenRepository.findByUserIdAndProjectId(userId, projectId)
                .map(tokenEntity -> textEncryptor.decrypt(tokenEntity.getEncryptedToken()))
                .orElse(null);
    }

    public boolean isTokenValid(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user",
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    public String getLatestCommitSha(Long userId, Long projectId, String owner, String repo, String branch) {
        String token = getDecryptedToken(userId, projectId);
        if (token == null) {
            throw new IllegalStateException("토큰이 존재하지 않습니다.");
        }
        return gitHubApiService.getLatestCommitSha(token, owner, repo, branch);
    }

}

