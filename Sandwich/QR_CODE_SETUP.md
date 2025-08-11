# QR 코드 설정 가이드

## 문제 해결

QR 코드가 "Access Denied" 오류로 표시되지 않는 문제를 해결하기 위해 다음 설정이 필요합니다.

## 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# AWS S3 설정 (필수)
AWS_ACCESS_KEY=your-access-key-here
AWS_SECRET_KEY=your-secret-key-here
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=your-bucket-name-here

# 기타 환경 변수들
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/sandwich_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
SPRING_REDIS_HOST=redis
SPRING_REDIS_PORT=6379

# OAuth2 설정
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Jasypt 암호화
JASYPT_ENCRYPTOR_PASSWORD=your-jasypt-password
```

## 2. AWS S3 버킷 설정

### 2.1 버킷 생성
1. AWS S3 콘솔에서 새 버킷을 생성하세요
2. 버킷 이름을 환경 변수 `S3_BUCKET_NAME`에 설정하세요

### 2.2 버킷 정책 설정
버킷에 다음 정책을 추가하여 공개 읽기 권한을 부여하세요:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### 2.3 CORS 설정
버킷의 CORS 설정에 다음을 추가하세요:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 3. AWS IAM 사용자 설정

1. AWS IAM에서 새 사용자를 생성하세요
2. 다음 정책을 연결하세요:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

3. 생성된 Access Key와 Secret Key를 환경 변수에 설정하세요

## 4. 애플리케이션 재시작

환경 변수를 설정한 후 애플리케이션을 재시작하세요:

```bash
# Docker Compose 사용 시
docker-compose down
docker-compose up -d

# 또는 직접 실행 시
./gradlew bootRun
```

## 5. 확인 방법

1. 프로젝트를 생성할 때 "QR 코드 생성" 옵션을 활성화하세요
2. 프로젝트 상세 페이지에서 QR 코드 버튼을 클릭하세요
3. QR 코드 이미지가 정상적으로 표시되는지 확인하세요

## 문제 해결

### 여전히 Access Denied 오류가 발생하는 경우:

1. **환경 변수 확인**: 모든 AWS 관련 환경 변수가 올바르게 설정되었는지 확인
2. **버킷 권한 확인**: S3 버킷의 정책과 CORS 설정이 올바른지 확인
3. **IAM 권한 확인**: IAM 사용자가 S3 버킷에 대한 적절한 권한을 가지고 있는지 확인
4. **로그 확인**: 애플리케이션 로그에서 S3 업로드 관련 오류 메시지 확인

### 로그 확인 방법:

```bash
# Docker Compose 로그 확인
docker-compose logs -f sandwich

# 또는 애플리케이션 로그에서 다음 메시지 확인:
# [S3 업로드] QR 파일 업로드 시작: qr/xxx.png
# [S3 업로드] 완료 - https://your-bucket.s3.amazonaws.com/qr/xxx.png
``` 