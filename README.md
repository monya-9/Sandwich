# 🥪 Sandwich

**Sandwich**는 개발자들의 포트폴리오를 손쉽게 전시하고, 프로젝트를 배포 및 추천받을 수 있는 통합 플랫폼입니다.

> “개발자들의 실력을 작품처럼 쌓고, 전시하고, 공유할 수 있도록!”

---
## 팀원 소개

<table>
  <tr>
    
<td align="center"><a href="https://github.com/monya-9"><img src="https://avatars.githubusercontent.com/u/64175828?v=4"
 width="100px;" alt=""/><br /><sub><b>조현주</b></sub></a><br /><a href="https://github.com/monya-9" title="Code">🏠</a></td>
    
 <td align="center"><a href="https://github.com/ghdtldus"><img src="https://avatars.githubusercontent.com/u/122412999?v=4"
 width="100px;" alt=""/><br /><sub><b>홍시연</b></sub></a><br /><a href="https://github.com/ghdtldus" title="Code">🏠</a></td>

 <td align="center"><a href="https://github.com/Dnut0121"><img src="https://avatars.githubusercontent.com/u/127921103?v=4"
 width="100px;" alt=""/><br /><sub><b>송원석</b></sub></a><br /><a href="https://github.com/Dnut0121" title="Code">🏠</a></td>

 <td align="center"><a href="https://github.com/Heoeunjin"><img src="https://avatars.githubusercontent.com/u/127829501?v=4"
 width="100px;" alt="https://github.com/nettiger0"/><br /><sub><b>허은진</b></sub></a><br /><a href="https://github.com/Heoeunjin" title="Code">🏠</a></td>

 <td align="center"><a href="https://github.com/ljjljj11"><img src="https://avatars.githubusercontent.com/u/202410083?v=4"
 width="100px;" alt=""/><br /><sub><b>이정주</b></sub></a><br /><a href="https://github.com/ljjljj11" title="Code">🏠</a></td>

</tr>
    
</table>

---

## 🧩 주요 기능

| 기능                     | 설명                                                                 |
|--------------------------|----------------------------------------------------------------------|
| 🔐 회원가입/로그인        | 이메일 기반 또는 소셜 로그인 (Google, Kakao 등) 지원                     |
| 👤 포트폴리오 등록/열람   | 개발자 프로필 + 프로젝트 리스트 등록 및 타인 열람 가능                     |
| 🚀 프로젝트 전시          | 대표 이미지, 설명, 사용 기술, 링크 등 포함한 전시 UI 제공                   |
| 💬 커뮤니티              | 게시글 및 댓글 작성 기능 제공                                          |
| 📈 추천/랭킹 시스템       | 좋아요 기반 인기 프로젝트 랭킹, Pick 콘텐츠 투표 등                        |
| 🧠 AI 추천               | 유저 관심사 기반 프로젝트 추천 (프로토타입: 간단한 조건 기반)               |
| 📊 대시보드              | 사용자 활동 및 등록 프로젝트/랭킹 확인 등 개인화된 정보 제공                |

---

## 🛠️ 기술 스택

| 파트       | 기술                                                                 |
|------------|----------------------------------------------------------------------|
| **Frontend** | React, TypeScript, Tailwind CSS                                     |
| **Backend**  | Spring Boot, JPA, MySQL                                             |
| **AI 추천**  | Python (Flask/FastAPI 기반 추천 로직 프로토타입)                    |
| **DevOps**   | Docker, GitHub Actions (CI/CD), AWS (예정)                         |
| **협업 도구** | Notion, Figma, GitHub Projects                                     |

---

## 🧪 Testing Strategy

서비스의 핵심 비즈니스 로직인 **인증(Auth), 보안(Security), 요청 제어(Rate Limit)**의 안정성을 확보하기 위해 단위 테스트와 슬라이스 테스트를 수행했습니다.

### 🛠 Tech Stack
- **Framework**: JUnit 5
- **Mocking**: Mockito (Service 계층 의존성 격리)
- **Slice Test**: MockMvc (Standalone Setup을 통한 필터/인터셉터 독립 검증)

### ✅ Key Test Cases

| Category | Test Target | Description |
| :--- | :--- | :--- |
| **Auth** | `JwtUtil` | Access/Refresh Token 생성, 파싱 및 만료 예외 처리 검증 |
| **Infra** | `RedisUtil` | Redis 저장소의 Token 저장, 조회, TTL 만료 및 삭제 로직 검증 |
| **Security** | `RecaptchaFilter` | 검증 대상 경로 접근 시 토큰 누락(`400`) 및 우회 토큰(`200`) 동작 확인 |
| **Limit** | `RateLimitInterceptor` | 분당/일일 요청 제한 초과 시 `429 Too Many Requests` 예외 발생 검증 |
| **Email** | `VerificationService` | 인증 코드 일치/불일치/만료 시나리오별 성공 및 예외 처리 검증 |

### 🧪 Key Test Snippets

주요 비즈니스 로직과 보안 관련 기능의 안정성을 확보하기 위해 다양한 테스트 케이스를 작성했습니다.

**1. Rate Limit 검증 (Integration Test)**
분당 요청 제한을 초과했을 때 `429 Too Many Requests` 예외가 발생하는지 검증합니다.

```java
@Test
@DisplayName("분당 요청 제한 초과 시 429 Too Many Requests 반환")
void throwExceptionWhenRateLimitExceeded() throws Exception {
    // 1. 첫 번째 요청: 성공 (200 OK)
    mockMvc.perform(post("/api/challenges/1/votes"))
           .andExpect(status().isOk());

    // 2. 두 번째 요청: 제한 초과 (429 Too Many Requests)
    mockMvc.perform(post("/api/challenges/1/votes"))
           .andExpect(status().isTooManyRequests())
           .andExpect(jsonPath("$.code").value("RATE_LIMIT_MINUTE"));
}
2. JWT Token 로직 검증 (Unit Test) 토큰 생성 및 파싱, 그리고 잘못된 토큰 입력 시의 예외 처리를 검증합니다.

Java

@Test
void accessToken_생성_및_이메일_추출_성공() {
    String email = "testuser@example.com";
    String role = "ROLE_USER";
    
    String token = jwtUtil.createAccessToken(email, role);
    String extractedEmail = jwtUtil.extractUsername(token);
    
    assertEquals(email, extractedEmail);
}

@Test
void 잘못된_토큰_입력시_JwtInvalidException_발생() {
    String invalidToken = "this.is.not.a.valid.token";
    
    assertThrows(JwtInvalidException.class, () -> {
        jwtUtil.parseClaims(invalidToken);
    });
}
3. reCAPTCHA 필터 검증 (Slice Test) 보안이 필요한 경로에 토큰 없이 접근할 경우 차단되는지 확인합니다.

Java

@Test 
@DisplayName("검증 대상 경로 + 토큰 없음 → 400 RECAPTCHA_FAIL")
void failWhenMissingTokenOnTargetPath() throws Exception {
    mockMvc.perform(post("/api/auth/login"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.code").value("RECAPTCHA_FAIL"));
}

----
## ⚙️ 설치 및 실행 방법
