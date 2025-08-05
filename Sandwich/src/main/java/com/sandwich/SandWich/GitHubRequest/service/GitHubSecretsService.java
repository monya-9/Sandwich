package com.sandwich.SandWich.GitHubRequest.service;

import com.sandwich.SandWich.GitHubRequest.util.GitHubSecretEncryptor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubSecretsService {
    private final RestTemplate restTemplate = new RestTemplate();

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
}
