plugins {
	java
	id("org.springframework.boot") version "3.3.11"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.sandwich"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-data-redis")
	implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-aop")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
	implementation("com.google.firebase:firebase-admin:9.2.0")
	implementation("io.jsonwebtoken:jjwt-api:0.11.5")
	implementation ("org.hibernate.validator:hibernate-validator")
	implementation("org.springframework.boot:spring-boot-starter-mail")
	compileOnly("org.projectlombok:lombok")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	implementation ("org.springframework.cloud:spring-cloud-starter-aws:2.2.6.RELEASE")
	implementation ("me.paulschwarz:spring-dotenv:2.5.4")
	implementation("com.google.zxing:core:3.5.1")
	implementation("com.google.zxing:javase:3.5.1")
	implementation("com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.4")
	implementation("org.json:json:20230227")
	implementation("com.goterl:lazysodium-java:5.1.4")
	implementation("com.vladmihalcea:hibernate-types-60:2.21.1")
	implementation ("com.microsoft.playwright:playwright:1.46.0")
	implementation("software.amazon.awssdk:s3:2.25.61")
	implementation ("org.springframework.boot:spring-boot-starter-websocket")
	implementation ("org.springframework:spring-messaging")
	implementation ("org.apache.httpcomponents.client5:httpclient5:5.2.1")
	implementation ("org.springframework.boot:spring-boot-starter-actuator")
	implementation ("org.springframework.boot:spring-boot-starter-webflux")
	runtimeOnly ("io.micrometer:micrometer-registry-prometheus")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")
	runtimeOnly("org.postgresql:postgresql")

	annotationProcessor("org.projectlombok:lombok")

	testImplementation("com.h2database:h2")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

tasks.bootJar {
	archiveFileName.set("app.jar")
}