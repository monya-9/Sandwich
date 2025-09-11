package com.sandwich.SandWich.message.attach.storage;

import com.sandwich.SandWich.message.attach.config.FileSecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.*;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URL;
import java.time.Duration;

@Service
@ConditionalOnProperty(name = "app.files.storage", havingValue = "s3")
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final FileSecurityProperties props;

    private S3Client client() {
        return S3Client.builder()
                .region(Region.of(props.getS3().getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
    private S3Presigner presigner() {
        return S3Presigner.builder()
                .region(Region.of(props.getS3().getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @Override
    public void save(byte[] bytes, String key, String contentType) {
        try (S3Client s3 = client()) {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(props.getS3().getBucket())
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3.putObject(req, RequestBody.fromBytes(bytes));
        } catch (Exception e) { throw new RuntimeException("S3 업로드 실패"); }
    }

    @Override
    public URL presignedGetUrl(String key, Duration ttl) {
        try (S3Presigner p = presigner()) {
            GetObjectRequest get = GetObjectRequest.builder()
                    .bucket(props.getS3().getBucket()).key(key).build();
            return p.presignGetObject(
                    GetObjectPresignRequest.builder().getObjectRequest(get).signatureDuration(ttl).build()
            ).url();
        }
    }

    @Override public org.springframework.core.io.Resource loadAsResource(String key) { return null; } // S3는 presign 사용

    @Override
    public byte[] load(String key) {
        try (S3Client s3 = client()) {
            GetObjectRequest req = GetObjectRequest.builder()
                    .bucket(props.getS3().getBucket())
                    .key(key).build();
            try (ResponseInputStream<GetObjectResponse> in = s3.getObject(req)) {
                return in.readAllBytes();
            }
        } catch (software.amazon.awssdk.services.s3.model.NoSuchKeyException e) {
            return null; // 키 없음 → null
        } catch (software.amazon.awssdk.services.s3.model.S3Exception e) {
            if (e.statusCode() == 404) return null;
            throw new RuntimeException("S3 파일 로드 실패", e);
        } catch (Exception e) {
            throw new RuntimeException("S3 파일 로드 실패", e);
        }
    }
}