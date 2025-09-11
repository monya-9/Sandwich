package com.sandwich.SandWich.notification.config;


import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;

import java.io.FileInputStream;
import java.io.InputStream;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp(@Value("${firebase.credentials.path}") String path) throws Exception {
        // classpath: , file path 모두 처리
        InputStream in;
        if (path.startsWith("classpath:")) {
            String p = path.substring("classpath:".length());
            in = FirebaseConfig.class.getResourceAsStream("/" + p);
            if (in == null) throw new IllegalStateException("Firebase credentials not found on classpath: " + p);
        } else {
            in = new FileInputStream(path);
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(in))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            log.info("[FCM] Initializing FirebaseApp");
            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.getInstance();
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp app) {
        // FirebaseApp 이후에 생성되도록 의존성 명시
        return FirebaseMessaging.getInstance(app);
    }
}