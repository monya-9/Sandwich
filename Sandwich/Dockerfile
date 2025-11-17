
# 1단계: Gradle 빌드 (테스트 제외)
FROM gradle:8.14.2-jdk17 AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle clean build --no-daemon -x test


# 2단계: 실행 이미지 (Playwright 브라우저 포함)
#  - 기존 ENTRYPOINT 옵션 그대로 유지
#  - 브라우저/폰트 의존성까지 포함되어 캡처 안정성↑
FROM mcr.microsoft.com/playwright/java:v1.46.0
WORKDIR /app

# libsodium (기존 Alpine에서 쓰던 라이브러리의 Debian/Ubuntu 대응 패키지)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsodium23 \
 && rm -rf /var/lib/apt/lists/*

# (선택) 한글/이모지 폰트 - 스크린샷 품질 향상
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     fonts-noto-cjk fonts-noto-color-emoji \
#  && rm -rf /var/lib/apt/lists/*

# Firebase 서비스 계정 파일 복사
# 1. 파일 경로(/app/creds) 생성
RUN mkdir -p /app/creds
# 2. 로컬의 JSON 파일을 컨테이너 내부의 /app/creds 경로로 복사 -> 바인딩 방식을 없앴기에 지움 -> 복사 필요하면 주석 해제
COPY firebase-service-account.json /app/creds/firebase-service-account.json

COPY --from=builder /app/build/libs/*.jar /app/app.jar

# 기존 실행 옵션 유지 (graceful shutdown & 안정 실행)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
