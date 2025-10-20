import os, json, datetime, pathlib, random, re, math, subprocess, sys, time, requests
from typing import List, Dict, Any, Iterable, Tuple
from dotenv import load_dotenv

# ===== env =====
ROOT = pathlib.Path(__file__).resolve().parents[1]
for p in [ROOT / ".env", ROOT.parents[0] / ".env", pathlib.Path(".env")]:
    if p.exists(): load_dotenv(p); break

# ===== ollama =====
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
MODEL = os.getenv("WEEKLY_MODEL", "qwen3:4b")
NUM_CTX = int(os.getenv("WEEKLY_NUM_CTX", "2048"))
MAX_NEW = int(os.getenv("WEEKLY_MAX_NEW_TOKENS", "480"))
GEN_OPTS_BASE = {"num_ctx": NUM_CTX, "num_predict": MAX_NEW, "temperature": 0.08, "top_p": 0.85}

# ===== worker =====
API_BASE = os.getenv("AI_API_BASE", "https://api.dnutzs.org")
API_KEY  = (os.getenv("AI_API_KEY") or os.getenv("X_AI_API_KEY") or "").strip()
HEADER   = os.getenv("AI_HEADER", "X-AI-API-Key")

# ===== files =====
OUT = pathlib.Path("out"); OUT.mkdir(exist_ok=True)
HIST = OUT / "_weekly_history.json"
ANS_PATH = OUT / "_weekly_answer.py"
RAW_PATH = OUT / "_weekly_last_raw.txt"

from weekly_prompts import WEEK_JSON_SYS, WEEK_JSON_USER, AREA_HINTS

# ===== history =====
def _load_history() -> list:
    try:
        if not HIST.exists(): return []
        return json.loads(HIST.read_text("utf-8") or "[]") or []
    except Exception:
        return []

def _save_history(rec: dict):
    arr = _load_history(); arr.append(rec)
    if len(arr) > 200: arr = arr[-200:]
    HIST.write_text(json.dumps(arr, ensure_ascii=False, indent=2), "utf-8")

def _recent_titles(limit=20) -> List[str]:
    return [str(x.get("title")) for x in _load_history() if x.get("title")][-limit:]

def _recent_areas(limit=12) -> List[str]:
    return [str(x.get("area_hint")) for x in _load_history() if x.get("area_hint")][-limit:]

def _recent_summaries(limit=20) -> List[str]:
    return [str(x.get("summary") or "") for x in _load_history()][-limit:]

# ===== week & hint =====
def _current_week_str() -> str:
    y, w, _ = datetime.datetime.now().isocalendar()
    return f"{y}W{w:02d}"

def _pick_area_hint(avoid: List[str]) -> str:
    cand = [a for a in AREA_HINTS if a not in set(avoid[-8:])]
    return random.choice(cand if cand else AREA_HINTS)

# ===== text utils =====
_UWS = "\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u200B"
_PUNCT = r"\-_/·•()\[\]{}:;,.!?\"'~`@#%^&*+=|\\<>"
_norm_re = re.compile(rf"[\s{_UWS}{_PUNCT}]+", re.UNICODE)
def _normalize(s: str) -> str: return _norm_re.sub("", (s or "").casefold())
def _tokens(s: str) -> List[str]:
    s = re.sub(r"[^\w가-힣]+", " ", s); s = re.sub(r"\s+", " ", s).strip()
    return [t for t in s.split() if t and len(t) >= 2]
def _trigrams(s: str) -> set:
    s = re.sub(r"\s+", " ", (s or "").strip())
    return {s[i:i+3] for i in range(len(s)-2)} if len(s) >= 3 else set()
def _jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    sa, sb = set(a), set(b)
    return 0.0 if not sa or not sb else len(sa & sb) / len(sa | sb)
def _is_title_novel(title: str, prev: List[str]) -> bool:
    ntoks = _tokens(title)
    for p in prev:
        if _normalize(p) == _normalize(title): return False
        if _jaccard(ntoks, _tokens(p)) >= 0.55: return False
    return True
def _summary_novel(summary: str, prev_summaries: List[str]) -> bool:
    t = _tokens(summary); tri = _trigrams(summary)
    for ps in prev_summaries:
        if _jaccard(t, _tokens(ps)) >= 0.45: return False
        if _jaccard(tri, _trigrams(ps)) >= 0.40: return False
    return True

def _strip_codefence(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*```$", "", s)
    return s.strip()

def _extract_json_candidates(text: str) -> List[str]:
    s = _strip_codefence(text or "")
    out, seen = [], set()
    n = len(s)
    for start in range(n):
        if s[start] != "{": continue
        i, depth, in_str, esc = start, 0, False, False
        while i < n:
            ch = s[i]
            if in_str:
                if esc: esc = False
                elif ch == "\\": esc = True
                elif ch == '"': in_str = False
            else:
                if ch == '"': in_str = True
                elif ch == "{": depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        cand = s[start:i+1]
                        if cand not in seen:
                            out.append(cand); seen.add(cand)
                        break
            i += 1
    return out

# ===== ollama(generate) =====
def call_ollama_json(system_msg: str, user_msg: str) -> dict:
    last_raw = ""
    for attempt in range(1, 7):
        payload = {
            "model": MODEL,
            "prompt": f"{system_msg}\n\n{user_msg}\n\n[ONLY JSON] 순수 JSON 객체 1개만 출력.",
            "format": "json",
            "stream": False,
            "options": {**GEN_OPTS_BASE, "temperature": max(0.04, 0.1 - 0.01*attempt)},
        }
        try:
            r = requests.post(f"{OLLAMA_BASE}/api/generate", json=payload, timeout=240)
            r.raise_for_status()
        except Exception:
            time.sleep(0.4 * attempt); continue
        resp = r.json().get("response", "") or ""
        last_raw = resp
        for cand in _extract_json_candidates(resp):
            try:
                obj = json.loads(cand)
            except Exception:
                continue
            if isinstance(obj, dict) and all(k in obj for k in ("title","summary","must_have","answer_py")):
                return obj
        time.sleep(0.4 * attempt)
    RAW_PATH.write_text(last_raw, encoding="utf-8")
    raise RuntimeError("Ollama JSON 파싱 실패")

# ===== 검증/실행 =====
_BANNED = ["특정 규칙","적절히","임의","등등","…","...","예를 들어"]
_LATEX_CMD = re.compile(r"\\[a-zA-Z]+")
_ALLOWED_IMPORT = re.compile(r"^\s*import\s+(math|sys)\s*$|^\s*from\s+(math|sys)\s+import\s+", re.M)
_FORBIDDEN_CODE = re.compile(r"\b(os|subprocess|socket|requests|eval|exec|__import__|open)\b")
_DEF_MAIN   = re.compile(r"def\s+main\s*\(\s*\)\s*:\s*[\r\n]+", re.M)
_MAIN_GUARD = re.compile(r"if\s+__name__\s*==\s*['\"]__main__['\"]\s*:\s*[\r\n]+", re.M)

def _find_tag_line(text: str, tag: str) -> str:
    m = re.search(rf"{tag}\s*:\s*(.+)", text)
    return m.group(1).strip() if m else ""

def _parse_ints(s: str) -> List[int]:
    return [int(x) for x in re.findall(r"-?\d+", s)]

def _stdin_from_example(ex_in: str) -> str:
    nums = _parse_ints(ex_in or "")
    if nums: return " ".join(str(x) for x in nums)
    return (ex_in or "").strip()

def _example_not_trivial(ex_in: str) -> bool:
    nums = _parse_ints(ex_in or "")
    multi_line = ("\n" in (ex_in or ""))
    enough_tokens = len(nums) >= 5
    distinct = len(set(nums)) >= 3
    any_two_digit = any(abs(x) >= 10 for x in nums)
    return (enough_tokens or multi_line) and distinct and any_two_digit

def _python_code_ok(code: str) -> bool:
    if "```" in code: return False
    if _FORBIDDEN_CODE.search(code): return False
    for m in re.finditer(r"^\s*(from\s+\w+\s+import|import\s+\w+)", code, re.M):
        if not _ALLOWED_IMPORT.search(m.group(0)): return False
    if not _DEF_MAIN.search(code): return False
    if not _MAIN_GUARD.search(code): return False
    try:
        compile(code, "<answer_py>", "exec")
    except SyntaxError:
        return False
    return True

def _run_answer(code: str, stdin_text: str) -> Tuple[bool, str]:
    ANS_PATH.write_text(code, encoding="utf-8")
    try:
        proc = subprocess.run(
            [sys.executable, str(ANS_PATH)],
            input=stdin_text.encode("utf-8"),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=6,
        )
    except subprocess.TimeoutExpired:
        return False, "timeout"
    out = proc.stdout.decode("utf-8", errors="replace").replace("\r\n","\n").strip("\n")
    lines = [ln for ln in out.split("\n") if ln.strip()!=""]
    return (len(lines)>=1), (lines[0] if lines else "")

# ===== 유사도/신규성 =====
def _top_tokens(texts: List[str], k=20) -> List[str]:
    from collections import Counter
    c = Counter()
    for t in texts:
        for tok in _tokens(t):
            if len(tok) >= 2: c[tok] += 1
    return [w for w,_ in c.most_common(k)]

def _novel_enough(title: str, summary: str, area: str,
                  prev_titles: List[str], prev_summaries: List[str], recent_areas: List[str]) -> bool:
    if area in set(recent_areas[-8:]): return False
    if not _is_title_novel(title, prev_titles): return False
    if not _summary_novel(summary, prev_summaries[-12:]): return False
    return True

def _validate_and_repair(obj: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    if not isinstance(obj, dict): return False, {}
    title   = str(obj.get("title") or "").strip()
    summary = str(obj.get("summary") or "").strip()
    must    = obj.get("must_have") or []
    answer  = str(obj.get("answer_py") or "").strip()
    if not title or not summary or not isinstance(must, list) or not answer:
        return False, {}
    if any(b in summary for b in _BANNED): return False, {}
    if _LATEX_CMD.search(summary): return False, {}
    if not _python_code_ok(answer): return False, {}

    ex_in  = _find_tag_line(summary, "예시 입력")
    ex_out = _find_tag_line(summary, "예시 출력")
    if not ex_in or not _example_not_trivial(ex_in): return False, {}

    stdin_norm = _stdin_from_example(ex_in)
    ok_run, got = _run_answer(answer, stdin_norm)
    if not ok_run or not got: return False, {}

    if not ex_out or (must and must[0].strip() != ex_out):
        ex_out = got
        if must: must[0] = ex_out
        else: must = [ex_out]
        if "예시 출력" not in summary:
            summary = summary.strip() + f"\n예시 출력: {ex_out}"

    # 제목 길이 보정
    if len(title) < 10: title = (title + " 고급 문제")[:26]
    if len(title) > 26: title = title[:26]

    return True, {
        "title": title,
        "summary": re.sub(r"\s{2,}", " ", summary).strip(),
        "must_have": [must[0]],
        "answer_py": answer,
        "example_input": stdin_norm,
        "example_output": ex_out,
    }

# ===== 로컬 백업 생성기 =====
def _fallback_problem() -> Dict[str, Any]:
    n = 12; k = 4; d = 9
    arr = [13, 2, 17, 8, 11, 6, 25, 9, 4, 16, 7, 10]
    cnt = 0
    for i in range(0, n-k+1):
        window = arr[i:i+k]
        s = sum(window)
        if s % 7 == 0 and (max(window) - min(window) >= d):
            cnt += 1
    ex_in = f"{n} {k} {d}\n" + " ".join(map(str,arr))
    ex_out = str(cnt)

    title = "이중 조건 윈도우 구간 집계"
    summary = (
        "문제: 1차원 배열에서 길이 k의 연속 구간 중 특정 조건을 만족하는 구간의 개수를 계산한다.\n"
        "입력: 첫 줄에 정수 n, k, d(1 ≤ k ≤ n ≤ 2×10^5, 0 ≤ d ≤ 10^9). 둘째 줄에 길이 n의 정수 배열이 주어진다(각 원소 |ai| ≤ 10^9).\n"
        "규칙: 각 길이 k 구간에 대해 (i) 원소 합이 7의 배수이고, (ii) 해당 구간의 최댓값−최솟값 ≥ d 일 때 유효로 간주한다. 배열은 수정하지 않는다.\n"
        "절차: (1) 윈도우에 새 원소를 추가하고 오래된 원소를 제거하며 합을 관리한다. (2) 최대·최소는 덱 두 개로 유지한다. "
        "(3) 두 조건을 동시에 만족하면 카운트를 증가시킨다. 빈 배열이나 k>n인 경우는 0으로 처리한다.\n"
        f"예시 입력: {ex_in}\n"
        f"예시 출력: {ex_out}\n"
        "출력 형식: 한 줄에 유효 구간의 개수를 출력한다."
    )
    answer_py = """import sys
from collections import deque

def main():
    data = sys.stdin.read().strip().split()
    if not data:
        print(0); return
    it = iter(map(int, data))
    try:
        n = next(it); k = next(it); d = next(it)
    except StopIteration:
        print(0); return
    arr = [next(it) for _ in range(n)] if n>0 else []
    if k<=0 or k>n:
        print(0); return

    s = sum(arr[:k])
    maxdq = deque()
    mindq = deque()

    def push(i):
        x = arr[i]
        while maxdq and arr[maxdq[-1]] <= x: maxdq.pop()
        while mindq and arr[mindq[-1]] >= x: mindq.pop()
        maxdq.append(i); mindq.append(i)

    def clean(i):
        left = i - k + 1
        while maxdq and maxdq[0] < left: maxdq.popleft()
        while mindq and mindq[0] < left: mindq.popleft()

    for i in range(k): push(i)
    ans = 0
    if s % 7 == 0 and (arr[maxdq[0]] - arr[mindq[0]] >= d): ans += 1

    for i in range(k, n):
        s += arr[i] - arr[i-k]
        push(i); clean(i)
        if s % 7 == 0 and (arr[maxdq[0]] - arr[mindq[0]] >= d): ans += 1

    print(ans)

if __name__ == "__main__":
    main()
"""
    return {"title": title, "summary": summary, "must_have": [ex_out], "answer_py": answer_py,
            "example_input": ex_in, "example_output": ex_out}

# ===== markdown / worker =====
def build_weekly_md(week_str: str, area: str, title: str, summary: str, must: List[str]) -> str:
    return (
        f"# {week_str} 주간 코딩문제\n"
        f"**제시어:** {area}\n"
        f"## {title}\n\n"
        f"{summary}\n\n"
        f"### 예시 입력의 정답(출력값)\n`{must[0]}`\n"
    )

def upsert_weekly_to_worker(week_str: str, title: str, summary: str, must: List[str], md: str) -> dict:
    if not API_KEY: raise RuntimeError("AI_API_KEY 필요")
    url = f"{API_BASE}/api/reco/admin/upsert/topics/weekly"
    r = requests.post(url, json={"week": week_str, "title": title, "summary": summary, "must": must, "md": md},
                      headers={HEADER: API_KEY}, timeout=60)
    if r.status_code >= 300:
        raise RuntimeError(f"worker_error status={r.status_code} body={r.text[:400]}")
    return r.json()

# ===== main =====
def main():
    week = _current_week_str()
    prev_titles   = _recent_titles(limit=30)
    prev_summaries= _recent_summaries(limit=30)
    prev_areas    = _recent_areas(limit=12)

    # 금지 토큰 추출(최근 요약에서 자주 쓰인 키워드)
    banned_tokens = _top_tokens(prev_summaries, k=20)

    last_err = None
    for attempt in range(1, 12):
        hint = _pick_area_hint(prev_areas)
        # 모델 호출
        obj = None
        try:
            obj = call_ollama_json(
                WEEK_JSON_SYS,
                WEEK_JSON_USER(int(week.split("W")[1]), hint, prev_titles, prev_areas, banned_tokens)
            )
        except Exception:
            obj = None

        # 검증/수리
        ok, data = (False, {})
        if obj:
            ok, data = _validate_and_repair(obj)
        if not ok:
            last_err = RuntimeError("schema_invalid_or_inconsistent"); continue

        # 신규성 검사
        if not _novel_enough(data["title"], data["summary"], hint, prev_titles, prev_summaries, prev_areas):
            last_err = ValueError("not_novel_enough"); continue

        # 실행 재검증
        ok2, got = _run_answer(data["answer_py"], data["example_input"])
        if not ok2 or got != data["example_output"]:
            last_err = RuntimeError(f"answer_check_failed want={data['example_output']} got={got}"); continue

        md = build_weekly_md(week, hint, data["title"], data["summary"], data["must_have"])
        resp = upsert_weekly_to_worker(week, data["title"], data["summary"], data["must_have"], md)

        # 히스토리 저장: area와 summary 포함
        _save_history({
            "ts": datetime.datetime.now().isoformat(),
            "week": week,
            "area_hint": hint,
            "title": data["title"],
            "summary": data["summary"]
        })
        print("[weekly] ok:", resp)
        print(f"[weekly] answer saved -> {ANS_PATH}")
        return

    # 실패 시 백업(백업은 유사도 검사 제외, 단 오늘만 사용)
    data = _fallback_problem()
    ok_run, got = _run_answer(data["answer_py"], data["example_input"])
    if not ok_run or got != data["example_output"]:
        raise last_err or RuntimeError("weekly_generation_failed")

    md = build_weekly_md(week, "백업-내부", data["title"], data["summary"], data["must_have"])
    resp = upsert_weekly_to_worker(week, data["title"], data["summary"], data["must_have"], md)
    _save_history({
        "ts": datetime.datetime.now().isoformat(),
        "week": week,
        "area_hint": "백업-내부",
        "title": data["title"],
        "summary": data["summary"]
    })
    print("[weekly:fallback] ok:", resp)

if __name__ == "__main__":
    main()
