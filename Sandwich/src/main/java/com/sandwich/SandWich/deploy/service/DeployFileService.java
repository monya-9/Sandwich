package com.sandwich.SandWich.deploy.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class DeployFileService {

    private final AmazonS3 amazonS3;

    // 배포용 S3 버킷
    @Value("${cloud.aws.s3.deploy.bucket}")
    private String deployBucket;

    /**
     * 배포용 파일 업로드
     * 경로: {userId}/{projectId}/deploy/{originalFilename}
     */
    public String uploadFile(String userId, Long projectId, MultipartFile file) throws IOException {
        String fileName = String.format("%s/%d/deploy/%s",
                userId, projectId, file.getOriginalFilename());

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        amazonS3.putObject(deployBucket, fileName, file.getInputStream(), metadata);

        return amazonS3.getUrl(deployBucket, fileName).toString();
    }

    /**
     * 배포용 파일 삭제
     */
    public void deleteFile(String fileUrl) {
        String fileKey = fileUrl.substring(fileUrl.indexOf(".com/") + 5);
        amazonS3.deleteObject(deployBucket, fileKey);
    }
}