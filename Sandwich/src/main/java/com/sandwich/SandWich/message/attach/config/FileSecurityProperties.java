package com.sandwich.SandWich.message.attach.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter @Setter
@Component
@ConfigurationProperties(prefix = "app.files")
public class FileSecurityProperties {
    private String storage = "local";
    private int maxSizeMb = 10;
    private String allowedExtensions = "jpg,png,pdf";
    private String allowedMimeTypes = "image/jpeg,image/png,application/pdf";

    private Local local = new Local();
    private S3 s3 = new S3();

    public Set<String> extSet() {
        return Stream.of(allowedExtensions.split(","))
                .map(s -> s.trim().toLowerCase()).collect(Collectors.toSet());
    }
    public Set<String> mimeSet() {
        return Stream.of(allowedMimeTypes.split(","))
                .map(String::trim).collect(Collectors.toSet());
    }

    @Getter @Setter public static class Local { private String baseDir = "uploads"; }
    @Getter @Setter public static class S3   {
        private String bucket;
        private String keyPrefix = "attachments/";
        private String region;
    }
}