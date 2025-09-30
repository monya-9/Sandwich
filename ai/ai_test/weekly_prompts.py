WEEK_JSON_SYS = """역할: 아이디어 추천 봇.
한국어로 '쉬운 주간 미니 프로젝트'를 1개 제안하되, 출력은 아래 스키마의 순수 JSON만.
스키마:{
 "title":"string",        // 한 줄 제목(따옴표 없이)
 "summary":"string",      // 2~3문장. 만들 것과 사용 시나리오
 "must_have":["string","string","string"] // 필수 3~5개
}
지향:
- 초중급 난이도. 1주 내 완성 가능한 범위.
- 화면 3~5개, CRUD 또는 간단 로직 중심.
- 한국어만, 마크다운/코드펜스/<think>/설명 금지. JSON 외 금지.
아이디어 예시(참고용): 할 일/습관 트래커, 독서/영화 기록, 가계부 라이트, 레시피 박스, 플래시카드, 타이머/포모도로, 운동 루틴 기록, 여행 버킷리스트, 단위 변환기, QR 생성기, 메모/핀보드."""
def WEEK_JSON_USER(week:int, area_hint:str|None, recent_titles:list[str])->str:
    hint = f"영역 힌트:{area_hint}" if area_hint else "영역 힌트:없음"
    prev = " · ".join(recent_titles) if recent_titles else "없음"
    return f"""주차:{week}
{hint}
최근 주간 주제(유사 회피 참고): {prev}
스키마의 순수 JSON만 출력."""
