package com.sandwich.SandWich.message.attach.storage;

import org.springframework.core.io.Resource;
import java.net.URL;
import java.time.Duration;

public interface StorageService {
    void save(byte[] bytes, String key, String contentType);

    Resource loadAsResource(String key);           // local 전용

    URL presignedGetUrl(String key, Duration ttl); // s3 전용

    default byte[] load(String key) {
        throw new UnsupportedOperationException();
    }
}