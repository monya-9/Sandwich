package com.sandwich.SandWich.GitHubRequest.util;

import com.goterl.lazysodium.LazySodiumJava;
import com.goterl.lazysodium.SodiumJava;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class GitHubSecretEncryptor {
    private static LazySodiumJava lazySodium;

    static {
        lazySodium = new LazySodiumJava(new SodiumJava());
    }

    public static String encryptSecret(String publicKeyBase64, String secretValue) {
        if (secretValue == null || secretValue.isEmpty()) {
            throw new IllegalArgumentException("Secret value cannot be null or empty");
        }

        // 1. 공개키 base64 디코딩
        byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);

        // 2. 암호화할 메시지 (secret)
        byte[] messageBytes = secretValue.getBytes(StandardCharsets.UTF_8);

        // 3. 결과를 담을 암호문 배열 (암호화된 길이 = message + 48)
        byte[] cipherText = new byte[messageBytes.length + 48];

        // 4. 암호화 수행
        boolean success = lazySodium.cryptoBoxSeal(cipherText, messageBytes, messageBytes.length, publicKeyBytes);
        if (!success) {
            throw new IllegalStateException("Encryption failed");
        }

        // 5. Base64 인코딩 후 반환
        return Base64.getEncoder().encodeToString(cipherText);
    }
}

