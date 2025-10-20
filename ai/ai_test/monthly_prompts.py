from typing import List, Iterable

# 프로젝트 영역 힌트 목록(무작위 선택의 모수)
AREA_HINTS: List[str] = [
    "협업","지식관리","생산성","교육","커뮤니티","데이터 시각화","창작/디자인",
    "헬스케어/웰빙","멘탈케어/감정일기","가계부/소비분석","영수증/지출관리",
    "운동/루틴 트래커","타이머/포모도로","독서 기록","영화/드라마 기록",
    "학습(퀴즈/플래시카드)","습관 형성","프로젝트 관리","OKR/목표관리",
    "회의록/요약","프롬프트 보조","개발자 도구","문서 변환/정리",
    "여행/버킷리스트","지도/장소기록","생활 편의(단위변환/QR)",
    "음악/플레이리스트","사진/갤러리","캘린더/일정","레시피/식단",
]

# ===== 시스템 프롬프트: 4주 프로젝트 기획자 =====
MONTH_JSON_SYS: str = """[SYSTEM]
너는 4주짜리 코딩 프로젝트를 정해주는 '프로젝트 기획자'다.
[AREA]에 '직접 관련된' 단일 프로젝트를 정의한다.
오직 JSON 객체 1개만 출력한다. 코드블록/마크다운/설명문/사고흐름 금지.
출력 키는 정확히 3개: title, summary, must_have.

산출물 규격
1) title: 한글 8~18자, 고유하고 기억하기 쉬운 이름(기술스택·수식어 남발 금지)
2) summary: 2~3문장, 자연스러운 문장으로
   - 누가 어떤 상황에서 겪는 불편인지
   - 이 프로젝트가 제공하는 핵심 흐름
   - 4주 MVP 범위
3) must_have: 정확히 4개
   - "동사 + 명사"로 구현 가능한 기능(모호어 단독 금지, 한 항목에 두 기능 금지)

하드 제약
- [PREVIOUS_TITLES]와 동일·유사한 주제 금지
- [USED_AREAS]에 이미 포함된 영역을 반복 금지. 반드시 [AREA]에 맞출 것
- JSON 외 텍스트는 절대 출력하지 말 것
"""

def MONTH_JSON_USER(
    ym: str,
    area: str,
    previous_titles: Iterable[str],
    used_areas: Iterable[str],
) -> str:
    prev = [t for t in previous_titles if isinstance(t, str) and t.strip()]
    prev_block = "\n".join(f"- {t.strip()}" for t in prev[-50:]) or "- 없음"
    used_block = ", ".join([a for a in used_areas if isinstance(a, str) and a.strip()]) or "없음"
    return f"""[CONTEXT]
- 기간: {ym}
- AREA: {area}
- USED_AREAS: {used_block}

[PREVIOUS_TITLES]
{prev_block}

[OUTPUT_JSON_SCHEMA]
{{
  "title": "string(8~18자, 한글, 고유)",
  "summary": "string(2~3문장, 사용자 가치 중심, 4주 MVP 범위 포함)",
  "must_have": ["string","string","string","string"]
}}
"""
