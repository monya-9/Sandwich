# weekly_main.py  (Cloud, 주제 자율/중복제외, 히스토리 out/ 저장)
import os, json, requests, pathlib, re, datetime, sys, random, hashlib, time
from typing import Dict, Any, List, Iterable, Tuple
from dotenv import load_dotenv

# ===== .env =====
ROOT = pathlib.Path(__file__).resolve().parents[1] if len(pathlib.Path(__file__).resolve().parents) > 1 else pathlib.Path.cwd()
for p in [ROOT / ".env", ROOT.parents[0] / ".env", pathlib.Path(".env")]:
    try:
        if p.exists(): load_dotenv(p); break
    except Exception:
        pass

# ===== Cloud / API =====
OLLAMA_BASE   = os.getenv("OLLAMA_BASE", "https://ollama.com").rstrip("/")
OLLAMA_APIKEY = (os.getenv("OLLAMA_API_KEY") or "").strip()
MODEL         = os.getenv("WEEKLY_MODEL", "deepseek-v3.1:671b-cloud")
NUM_CTX       = int(os.getenv("WEEKLY_NUM_CTX", "2048"))
MAX_NEW       = int(os.getenv("WEEKLY_MAX_NEW_TOKENS", "700"))
COUNT         = int(os.getenv("WEEKLY_MULTI_COUNT", "3"))

API_BASE  = os.getenv("AI_API_BASE", "https://api.dnutzs.org").rstrip("/")
API_KEY   = (os.getenv("AI_API_KEY") or os.getenv("X_AI_API_KEY") or "").strip()
AI_HEADER = os.getenv("AI_HEADER", "X-AI-API-Key")

OUT_DIR = pathlib.Path("out"); OUT_DIR.mkdir(exist_ok=True)
HIST    = OUT_DIR / "_weekly_history.json"

# ===== 텍스트 유틸 =====
_UWS   = "\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u200B"
_PUNCT = r"\-_/·•()\[\]{}:;,.!?\"'~`@#%^&*+=|\\<>"
def _normalize(s: str) -> str:
    import re
    s = (s or "").casefold()
    return re.sub(rf"[\s{_UWS}{_PUNCT}]+", "", s)
def _tokens(s: str) -> List[str]:
    import re
    s = re.sub(r"[^\w가-힣]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return [t for t in s.split(" ") if t]
def _char_ngrams(s: str, n: int = 3) -> List[str]:
    s = _normalize(s)
    return [s[i:i+n] for i in range(len(s)-n+1)] if len(s) >= n else [s]
def _jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa or not sb: return 0.0
    return len(sa & sb) / len(sa | sb)

def is_title_novel(title: str, prev_titles: List[str], thr: float = 0.55) -> bool:
    for p in prev_titles:
        if _jaccard(_char_ngrams(title), _char_ngrams(p)) >= thr: return False
        if _jaccard(_tokens(title), _tokens(p)) >= thr: return False
    return True

def is_area_novel(area: str, recent_areas: List[str], thr: float = 0.55) -> bool:
    a = _tokens(area)
    for r in recent_areas:
        if _jaccard(a, _tokens(r)) >= thr: return False
    return True

# ===== 히스토리 IO =====
def _load_hist() -> List[Dict[str, Any]]:
    try:
        if not HIST.exists(): return []
        return json.loads(HIST.read_text("utf-8") or "[]") or []
    except Exception:
        return []
def _save_hist_item(item: Dict[str, Any]) -> None:
    arr = _load_hist(); arr.append(item)
    if len(arr) > 300: arr = arr[-300:]
    HIST.write_text(json.dumps(arr, ensure_ascii=False, indent=2), "utf-8")
def recent_titles(limit=60) -> List[str]:
    return [x.get("title","") for x in _load_hist()][-limit:]
def recent_areas(limit=30) -> List[str]:
    return [x.get("area","") for x in _load_hist()][-limit:]

# ===== 모델 호출 =====
CODE_BLOCK_RE = re.compile(r"```(?P<lang>[a-zA-Z0-9_-]*)\s*(?P<code>[\s\S]*?)```", re.M)
def _headers_cloud() -> Dict[str,str]:
    h = {"Content-Type":"application/json"}
    if OLLAMA_BASE.startswith("https://ollama.com"):
        if not OLLAMA_APIKEY: raise RuntimeError("OLLAMA_API_KEY 필요")
        h["Authorization"] = f"Bearer {OLLAMA_APIKEY}"
    return h

def _extract_json_candidates(text: str):
    s = text or ""
    for m in CODE_BLOCK_RE.finditer(s):
        if m.group("lang").lower() == "json":
            yield m.group("code").strip()
    s2 = re.sub(r"^```(?:json|python)?\s*|\s*```$", "", (text or "").strip(), flags=re.I)
    n=len(s2); seen=set()
    for st in range(n):
        if st<n and s2[st]=="{":
            i=st; depth=0; ins=False; esc=False
            while i<n:
                ch=s2[i]
                if ins:
                    if esc: esc=False
                    elif ch=="\\": esc=True
                    elif ch=='"': ins=False
                else:
                    if ch=='"': ins=True
                    elif ch=='{': depth+=1
                    elif ch=='}':
                        depth-=1
                        if depth==0:
                            cand=s2[st:i+1]
                            if cand not in seen:
                                seen.add(cand); yield cand
                            break
                i+=1

def _week_str() -> str:
    y, w, _ = datetime.datetime.now().isocalendar()
    return f"{y}W{w:02d}"

FORBIDDEN_AI = [
    "AI","인공지능","머신러닝","딥러닝","LLM","신경망","뉴럴","Transformer","파인튜닝","미세조정",
    "학습","훈련","추론","강화학습","GPT","Stable Diffusion","Diffusion",
    "PyTorch","TensorFlow","CUDA","쿠다","GPU","텐서","벡터 임베딩"
]
def _contains_forbidden(s: str) -> bool:
    s = (s or "").lower()
    return any(k.lower() in s for k in FORBIDDEN_AI)

def _build_messages(week: str, dedup_note: str) -> List[Dict[str,str]]:
    spec_rule = (
        "사양 제한: 중저사양 노트북(8–16GB RAM, 내장그래픽/iGPU)에서 풀 수 있는 알고리즘 문제만 허용. "
        "AI/ML/LLM/딥러닝/외부 AI API/고사양 GPU 의존 금지."
    )
    sys_msg = (
        "너는 한국어 코딩 문제 생성기다. 아래 JSON 스키마로만 답하라.\n"
        "스키마:{"
        "\"area\":\"알고리즘 주제 한 줄\","
        "\"title\":\"문제 제목(최대 26자)\","
        "\"summary\":\"문제 설명+입력/출력 형식+제약+예시 입력/예시 출력(한국어)\","
        "\"must_have\":[\"예시 출력의 정답 1개\"],"
        "\"answer_py\":\"표준입력 읽어 정답 출력하는 파이썬 코드(표준 라이브러리만)\"}\n"
        f"규칙:\n- {spec_rule}\n- answer_py는 main()과 __name__ 가드 포함.\n- 오직 위 JSON만 출력."
    )
    user_msg = (
        f"[주차] {week}\n"
        "중복 없이 참신한 주제(area)와 문제를 스스로 정하라. "
        f"{dedup_note}"
    )
    return [{"role":"system","content":sys_msg},{"role":"user","content":user_msg}]

def _seed_from(tag: str, attempt: int) -> int:
    h = hashlib.md5(f"{tag}:{attempt}".encode()).hexdigest()
    return int(h[:8], 16)

def call_model(week: str, tries: int = 9, backoff: float = 0.5) -> Dict[str,Any]:
    url = f"{OLLAMA_BASE}/api/chat"
    prev_t = recent_titles(80)
    prev_a = recent_areas(24)
    dedup_note = ""
    if prev_t: dedup_note += "최근 제목과 유사하지 않게 하라. "
    if prev_a: dedup_note += "최근 사용 주제와 겹치지 마라."

    for t in range(1, tries+1):
        seed = _seed_from(week, t) ^ random.getrandbits(16)
        payload = {
            "model": MODEL,
            "messages": _build_messages(week, dedup_note),
            "format": "json",
            "stream": False,
            "options": {
                "num_ctx": NUM_CTX, "num_predict": MAX_NEW,
                "temperature": 0.35 + 0.05*(t-1),
                "top_p": 0.9,
                "repeat_penalty": 1.1 + 0.02*(t-1),
                "seed": int(seed)
            }
        }
        try:
            r = requests.post(url, json=payload, headers=_headers_cloud(), timeout=180)
            if r.status_code >= 400:
                time.sleep(backoff * t); continue
            data = r.json()
            content = (data.get("message") or {}).get("content") or data.get("response") or ""
        except Exception:
            time.sleep(backoff * t); continue

        parsed = None
        for cand in _extract_json_candidates(content):
            try:
                obj = json.loads(cand)
                if isinstance(obj, dict):
                    parsed = obj; break
            except Exception:
                pass
        if not parsed:
            time.sleep(backoff * t); continue

        area   = str(parsed.get("area") or "").strip() or "자동 생성 주제"
        title  = (str(parsed.get("title") or f"자동생성 문제 {t}").strip())[:26]
        summary= str(parsed.get("summary") or "").strip()
        must   = parsed.get("must_have") or []
        answer = str(parsed.get("answer_py") or "").strip()

        if _contains_forbidden(area) or _contains_forbidden(title) or _contains_forbidden(summary):
            time.sleep(backoff * t); continue
        if not is_title_novel(title, prev_t):
            time.sleep(backoff * t); continue
        if not is_area_novel(area, prev_a):
            time.sleep(backoff * t); continue

        return {"area":area,"title":title,"summary":summary,"must_have":must,"answer_py":answer}

    # 폴백
    return {
        "area":"배열 슬라이딩 윈도우",
        "title":"특정 합 연속구간 개수",
        "summary":"정수 배열에서 길이 k 연속구간의 합이 m의 배수인 구간 개수를 구한다.\n예시 입력: 5 3 4\n1 2 3 4 5\n예시 출력: 2",
        "must_have":["2"],
        "answer_py":"import sys\n\ndef main():\n    data=sys.stdin.read().strip().split()\n    if not data:\n        print(0);return\n    it=iter(map(int,data))\n    n=next(it);k=next(it);m=next(it)\n    arr=[next(it) for _ in range(n)]\n    s=sum(arr[:k]);cnt=0\n    if s%m==0: cnt+=1\n    for i in range(k,n):\n        s+=arr[i]-arr[i-k]\n        if s%m==0: cnt+=1\n    print(cnt)\n\nif __name__=='__main__':\n    main()\n"
    }

# ===== 업서트/MD =====
def build_md(week: str, area: str, title: str, summary: str, must: List[str]) -> str:
    m0 = (must or [''])[0]
    return (
        f"# {week} 주간 코딩문제\n"
        f"**제시어:** {area}\n"
        f"## {title}\n\n{summary}\n\n"
        f"### 예시 입력의 정답(출력값)\n`{m0}`\n"
    )

def upsert_weekly_multi(week: str, idx: int, title: str, summary: str, must: List[str], md: str) -> Dict[str,Any]:
    if not API_KEY:
        print("[warn] AI_API_KEY 미설정. 업서트 생략.")
        return {"skipped": True}
    url = f"{API_BASE}/api/reco/admin/upsert/topics/weekly-multi"
    payload = {"week": week, "idx": idx, "title": title, "summary": summary, "must": must, "md": md}
    r = requests.post(url, json=payload, headers={AI_HEADER: API_KEY, "Content-Type":"application/json"}, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"upsert_error status={r.status_code} body={r.text[:400]}")
    try:
        return r.json()
    except Exception:
        return {"raw": r.text}

# ===== main =====
def main():
    week = _week_str()
    for i in range(1, COUNT+1):
        obj = call_model(week)
        area, title, summary, must, answer = (
            obj["area"], obj["title"], obj["summary"], obj.get("must_have") or [], obj.get("answer_py") or ""
        )
        # 해답 저장
        ans_path = OUT_DIR / f"answer_{week}_{i}.py"
        ans_path.write_text(answer, encoding="utf-8")
        print(f"[save] {ans_path}")

        md = build_md(week, area, title, summary, must)
        try:
            res = upsert_weekly_multi(week, i, title, summary, must, md)
            print(f"[upsert] week={week} idx={i} ->", res)
        except Exception as e:
            print(f"[upsert-error] idx={i}: {e}")

        _save_hist_item({"ts": datetime.datetime.now().isoformat(), "week": week, "idx": i,
                         "area": area, "title": title})

    print(f"[done] week={week} generated={COUNT}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FATAL:", e, file=sys.stderr)
        sys.exit(1)
