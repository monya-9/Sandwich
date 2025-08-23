package com.sandwich.SandWich.message.attach.storage;

import com.sandwich.SandWich.message.attach.config.FileSecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@Service
@ConditionalOnProperty(name = "app.files.storage", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalStorageService implements StorageService, InitializingBean {
    private final FileSecurityProperties props;

    @Override public void afterPropertiesSet() {
        new File(props.getLocal().getBaseDir()).mkdirs();
    }

    @Override
    public void save(byte[] bytes, String key, String contentType) {
        try {
            Path path = Path.of(props.getLocal().getBaseDir(), key);
            Files.createDirectories(path.getParent());
            try (FileOutputStream fos = new FileOutputStream(path.toFile())) { fos.write(bytes); }
        } catch (Exception e) { throw new RuntimeException("로컬 저장 실패"); }
    }

    @Override
    public Resource loadAsResource(String key) {
        File f = Path.of(props.getLocal().getBaseDir(), key).toFile();
        if (!f.exists()) throw new RuntimeException("파일 없음");
        return new FileSystemResource(f);
    }

    @Override public URL presignedGetUrl(String key, Duration ttl) { return null; }
}