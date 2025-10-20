from typing import List

AREA_HINTS: List[str] = [
    # 수열·수학/DP
    "부분수열 합(중복 허용)", "최장 증가 부분수열 변형", "구간 곱 모듈러", "피보나치 DP 변형",
    "배낭 문제 소형", "조합 동적계획(제약)", "행렬 지수(작은 차수)",
    # 배열·문자열
    "슬라이딩 윈도우 이중 조건", "문자열 편집거리(소형)", "회문 분할 최소화",
    "빈도 기반 재정렬", "아나그램 그룹화", "중복 허용 투포인터",
    # 그래프·격자
    "BFS 최단거리(장애물)", "위상 정렬(소형 DAG)", "유니온파인드(기본)",
    "격자 경로 DP(장애물 포함)", "미로 경로 개수(가중치 없음)",
    # 자료구조·파싱
    "LRU 캐시 시뮬레이션", "우선순위 큐 작업 스케줄링", "로그 파싱 집계",
    "CSV 파싱 정제 후 통계", "간단 JSON 파싱 후 카운트",
]

WEEK_JSON_SYS = """[ROLE]
너는 한국어 '코딩문제 출제자'다. [AREA_HINT]와 직접 관련된, 1주 안에 풀 수 있는 **단일 문제 1개**를 낸다.
난이도는 **중상**. 최소 3단계 이상의 사고(정제→구성→집계 등)와 엣지케이스 포함.

[OUTPUT ONLY JSON — STRICT]
오직 **순수 JSON 객체 1개**만 출력. 코드블록·마크다운·설명문·접두·접미 금지.
키는 **정확히 4개**: title, summary, must_have, answer_py

[SPEC]
- title: 한글 10~26자. 고유. 최근 제목과 유사 금지.
- summary: 5~8문장. 반드시 포함:
  ① 문제: 무엇을 계산하는지 1문장.
  ② 입력: 형식·범위·제약(크기 상한, 중복 허용 여부 등) 1~2문장.
  ③ 규칙: 핵심 알고리즘 규칙을 단계적으로 명시. **최소 3단계**. 엣지케이스 1개 이상.
  ④ 예시 입력: `예시 입력: <stdin 그대로>` — 변수명/라벨/등호 금지. **한 줄에 5개 이상 토큰 또는 다중 줄 입력**.
      · 값 3개 이상 서로 달라야 하며, 적어도 1개는 두 자리 수.
  ⑤ 예시 출력: `예시 출력: <값>` — 위 예시 입력의 정확한 출력값.
  ⑥ 출력 형식: "출력 형식: 한 줄에 XXX를 출력한다."
- must_have: 길이 1. 요소 0은 **예시 출력과 완전히 동일한 문자열**.
- answer_py: **Python 3 순수 스크립트**. 표준입력만 사용. 표준출력에 **정답만 1줄** 출력.
  · 외부 라이브러리/네트워크/파일 금지. import는 math, sys만 허용.
  · eval/exec/__import__/os/subprocess/socket/requests/open 금지.
  · 아래 기본 틀을 반드시 포함:
    import sys
    def main():
        data = sys.stdin.read().strip().split()
        # 입력 파싱
        # 계산 로직
        print(result)
    if __name__ == "__main__":
        main()

[DIVERSITY / NOVELTY]
- 최근 N주(컨텍스트로 제공)의 제목·제시어·핵심 규칙·입력 형식과 **중복되지 않도록** 설계하라.
- 특히 아래 '최근 제시어'와 '금지 토큰'을 **사용하지 마라**. 새로운 접근·자료구조·조건을 도입하라.

[CONSTRAINTS]
- 라텍스/백슬래시 수식 금지: \\sum, \\in, \\le 등 금지. 필요 시 유니코드 기호 또는 한글 설명.
- 격자/크기 표기 일관성: 고정 A×B면 추가 변수(n,m) 요구 금지. 변수를 쓰면 고정 수치 병기 금지.
- JSON 외 텍스트 출력 금지.
"""

def WEEK_JSON_USER(week:int, area_hint:str, recent_titles:list[str], recent_areas:list[str], banned_tokens:list[str]) -> str:
    prev_t = "\n".join(f"- {t}" for t in recent_titles[-20:]) if recent_titles else "- 없음"
    prev_a = ", ".join(recent_areas[-10:]) if recent_areas else "없음"
    banned = ", ".join(banned_tokens[:15]) if banned_tokens else "없음"
    return f"""[CONTEXT]
- 주차: {week}
- AREA_HINT(이번 주 후보): {area_hint}
- 최근 제시어(피해야 함): {prev_a}
- 최근 주간 제목(유사 회피):
{prev_t}
- 금지 토큰(최근 문제의 핵심 규칙/키워드): {banned}

[ONLY RETURN THIS JSON SCHEMA]
{{
  "title": "string",
  "summary": "string",
  "must_have": ["string"],
  "answer_py": "string"
}}
"""
