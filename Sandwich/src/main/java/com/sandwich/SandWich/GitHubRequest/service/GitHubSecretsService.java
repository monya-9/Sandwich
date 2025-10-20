package com.sandwich.SandWich.GitHubRequest.service;

import com.sandwich.SandWich.GitHubRequest.util.GitHubSecretEncryptor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;


import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubSecretsService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.github.com")
            .build();

    /**
     * GitHub 저장소에 Secrets 자동 등록
     */
    public void createOrUpdateSecret(String token, String owner, String repo, String secretName, String secretValue) throws Exception {
        // 1. 공개키 조회
        String publicKeyUrl = String.format("https://api.github.com/repos/%s/%s/actions/secrets/public-key", owner, repo);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);

        ResponseEntity<Map> publicKeyResponse = restTemplate.exchange(publicKeyUrl, HttpMethod.GET, getEntity, Map.class);
        Map<String, Object> body = publicKeyResponse.getBody();
        String publicKey = (String) body.get("key");
        String keyId = body.get("key_id").toString();

        // 2. 비밀값 암호화
        String encryptedValue = GitHubSecretEncryptor.encryptSecret(publicKey, secretValue);

        // 3. 비밀값 등록 요청
        String putSecretUrl = String.format("https://api.github.com/repos/%s/%s/actions/secrets/%s", owner, repo, secretName);
        Map<String, Object> putBody = new HashMap<>();
        putBody.put("encrypted_value", encryptedValue);
        putBody.put("key_id", keyId);

        HttpHeaders putHeaders = new HttpHeaders();
        putHeaders.setBearerAuth(token);
        putHeaders.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> putEntity = new HttpEntity<>(putBody, putHeaders);

        restTemplate.exchange(putSecretUrl, HttpMethod.PUT, putEntity, Void.class);
    }

    /**
     * WebClient 기반 Env용 GitHub Secrets 등록
     */
    public void createOrUpdateSecretWebClient(String gitHubToken, String owner, String repo, String key, String value) throws Exception {
        if (gitHubToken == null || gitHubToken.isEmpty()) {
            throw new IllegalArgumentException("GitHub 토큰이 필요합니다.");
        }

        // 1. 공개키 조회
        Map keyMap = webClient.get()
                .uri("/repos/{owner}/{repo}/actions/secrets/public-key", owner, repo)
                .header("Authorization", "Bearer " + gitHubToken)
                .header("Accept", "application/vnd.github+json")
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        String publicKey = (String) keyMap.get("key");
        String keyId = (String) keyMap.get("key_id");

        // 2. 비밀값 암호화
        String encryptedValue = GitHubSecretEncryptor.encryptSecret(publicKey, value);

        // 3. GitHub에 PUT
        webClient.put()
                .uri("/repos/{owner}/{repo}/actions/secrets/{secret_name}", owner, repo, key)
                .header("Authorization", "Bearer " + gitHubToken)
                .header("Accept", "application/vnd.github+json")
                .bodyValue(Map.of(
                        "encrypted_value", encryptedValue,
                        "key_id", keyId
                ))
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }

    /**
     * 토큰 유효성 체크 (WebClient)
     */
    public boolean isTokenValid(String gitHubToken) {
        try {
            String response = webClient.get()
                    .uri("/user")
                    .header("Authorization", "Bearer " + gitHubToken)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return response != null && !response.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
