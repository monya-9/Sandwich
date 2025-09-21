# 계정 검색 API 개선 요청사항

## 1. 현재 API 응답에 추가 필요한 필드

### 현재 응답:
```json
{
  "id": 22,
  "nickname": "안녕하시렵니까",
  "avatarUrl": null,
  "isVerified": true
}
```

### 요청하는 응답:
```json
{
  "id": 22,
  "nickname": "안녕하시렵니까",
  "email": "user@example.com",  // 추가 필요
  "avatarUrl": null,
  "isVerified": true,
  "position": "백엔드 개발자",  // 추가 필요
  "projects": [                 // 추가 필요
    {
      "id": 1,
      "title": "프로젝트 제목",
      "description": "프로젝트 설명",
      "thumbnailUrl": "https://example.com/thumb.jpg"
    }
  ]
}
```

## 2. API 엔드포인트 수정 요청

### 현재: `GET /api/search/accounts?q=검색어&page=0&size=20`

### 요청사항:
1. **프로젝트 정보 포함**: 각 계정의 최근 프로젝트 3개 포함
2. **포지션 정보 포함**: 사용자의 포지션/역할 정보 포함
3. **빈 검색어 처리** (선택사항): `q` 파라미터가 없거나 빈 문자열일 때 모든 계정 반환 (현재는 프론트엔드에서 더미 데이터로 처리 중)

## 3. 데이터베이스 조인 요청

```sql
-- 예시 쿼리 (백엔드 개발자 참고용)
SELECT 
    u.id,
    u.nickname,
    u.email,
    u.avatar_url,
    u.is_verified,
    p.position_name,
    json_agg(
        json_build_object(
            'id', proj.id,
            'title', proj.title,
            'description', proj.description,
            'thumbnail_url', proj.thumbnail_url
        ) ORDER BY proj.created_at DESC
    ) FILTER (WHERE proj.id IS NOT NULL) as projects
FROM users u
LEFT JOIN user_positions up ON u.id = up.user_id
LEFT JOIN positions p ON up.position_id = p.id
LEFT JOIN projects proj ON u.id = proj.user_id
WHERE (q IS NULL OR q = '' OR LOWER(u.nickname) LIKE LOWER('%' || q || '%'))
GROUP BY u.id, u.nickname, u.email, u.avatar_url, u.is_verified, p.position_name
ORDER BY u.created_at DESC
LIMIT 20 OFFSET (page * size);
```

## 4. 우선순위

1. **높음**: 이메일 필드 추가 (프로필 이미지용)
2. **중간**: 포지션 정보 추가
3. **낮음**: 프로젝트 정보 추가 (성능 고려)
