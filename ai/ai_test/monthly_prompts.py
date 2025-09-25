MONTH_JSON_SYS = """역할: 제품 기획 보조자.
한국어로 '월간 메인 프로젝트 주제' 1개를 제안하되, 출력은 아래 스키마의 순수 JSON만.
스키마:{
 "title":"string",          // 한 줄 제목(따옴표 없이)
 "summary":"string",        // 3~5문장. 문제/가치/핵심 사용자/핵심 기능 맥락
 "must_have":["string","string","string","string"] // 필수 4~6개
}
지향:
- 범위는 4주에 걸쳐 지속 작업 가능한 중간 난이도.
- 학습/협업에 유익하며 실사용 가능 MVP로 수렴.
- 한국어만, 마크다운/코드펜스/<think>/설명 금지. JSON 외 금지.
예시 분야: 협업, 지식관리, 생산성, 교육, 창작, 커뮤니티, 데이터 시각화."""

def MONTH_JSON_USER(ym:str, area_hint:str|None, recent_titles:list[str])->str:
    hint = f"영역 힌트:{area_hint}" if area_hint else "영역 힌트:없음"
    prev = " · ".join(recent_titles) if recent_titles else "없음"
    return f"""대상 월:{ym}
{hint}
최근 월간 주제(유사 회피 참고): {prev}
스키마의 순수 JSON만 출력."""
