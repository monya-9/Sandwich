# 1단계: Gradle 빌드
FROM gradle:8.14.2-jdk17-alpine as builder

WORKDIR /app

COPY --chown=gradle:gradle . .

RUN gradle clean build --no-daemon -x test

# 2단계: 실행용 경량 이미지
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

# graceful shutdown 및 안정 실행 옵션 추가
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]