package com.sandwich.SandWich.upload.util;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.sandwich.SandWich.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class S3Uploader {

    private final AmazonS3 amazonS3;
    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String upload(MultipartFile file, String dirName) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = originalName.substring(originalName.lastIndexOf('.'));
        String fileName = dirName + "/" + UUID.randomUUID() + extension;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        log.info("[S3 업로드] QR 파일 업로드 시작: {}", fileName);
        amazonS3.putObject(bucket, fileName, file.getInputStream(), metadata);
        log.info("[S3 업로드] 완료 - {}", amazonS3.getUrl(bucket, fileName));

        return amazonS3.getUrl(bucket, fileName).toString();
    }

    public String uploadQrImage(byte[] imageBytes) {
        String fileName = "qr/" + UUID.randomUUID() + ".png";
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(imageBytes.length);
        metadata.setContentType("image/png");

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes)) {
            amazonS3.putObject(bucket, fileName, inputStream, metadata);
            return amazonS3.getUrl(bucket, fileName).toString();
        } catch (IOException e) {
            throw new RuntimeException("S3 QR 업로드 실패", e);
        }
    }
}
