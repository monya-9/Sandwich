package com.sandwich.SandWich.GitHubRequest.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdditionalFileService {
    private static final String BUCKET_NAME = System.getenv("S3_DEPLOY_BUCKET_NAME");
    private final S3Client s3Client = S3Client.builder()
            .region(Region.AP_NORTHEAST_2)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();

    /**
     * 프로젝트 ID 기준으로 S3에 올라간 추가 파일 키 목록 가져오기
     */
    public List<String> getS3KeysByUserAndProject(Long userId, Long projectId) {
        String prefix = "user_" + userId + "/" + projectId + "/deploy/";

        ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                .bucket(BUCKET_NAME)
                .prefix(prefix)
                .build();

        return s3Client.listObjectsV2(listRequest)
                .contents()
                .stream()
                .map(S3Object::key)
                .collect(Collectors.toList());
    }

}
