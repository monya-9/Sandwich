package com.sandwich.SandWich.config;

import org.springframework.beans.factory.annotation.Value;
import org.jasypt.util.text.AES256TextEncryptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EncryptionConfig {

    @Value("${JASYPT_ENCRYPTOR_PASSWORD}")
    private String encryptionKey;

    @Bean
    public AES256TextEncryptor textEncryptor() {
        AES256TextEncryptor encryptor = new AES256TextEncryptor();
        encryptor.setPassword(encryptionKey);
        return encryptor;
    }
}