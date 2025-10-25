# monthly_main.py  (Cloud, 창의 주제/중복제외, AI·GPU 금지, 히스토리 out/ 저장)
import os, json, pathlib, datetime, argparse, time, hashlib, random, re, sys
from typing import List, Dict, Any, Tuple, Iterable
import requests
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[1] if len(pathlib.Path(__file__).resolve().parents) > 1 else pathlib.Path.cwd()
for p in [ROOT / ".env", ROOT.parents[0] / ".env", pathlib.Path(".env")]:
    try:
        if p.exists(): load_dotenv(p); break
    except Exception:
        pass

# ===== Ollama Cloud =====
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "https://ollama.com").rstrip("/")
OLLAMA_API_KEY = (os.getenv("OLLAMA_API_KEY") or "").strip()
MODEL       = os.getenv("MONTHLY_MODEL", "deepseek-v3.1:671b-cloud")
NUM_CTX     = int(os.getenv("MONTHLY_NUM_CTX", "3072"))
MAX_NEW     = int(os.getenv("MONTHLY_MAX_NEW_TOKENS", "900"))

# ===== Worker API =====
API_BASE   = os.getenv("API_BASE", "https://api.dnutzs.org").rstrip("/")
API_KEY    = (os.getenv("AI_API_KEY") or os.getenv("X_AI_API_KEY") or "").strip()
HEADER_KEY = os.getenv("AI_HEADER", "X-AI-API-Key")

OUT_DIR    = pathlib.Path("out"); OUT_DIR.mkdir(exist_ok=True)
HIST_PATH  = OUT_DIR / "_monthly_history.json"

# ===== 금지 주제/사양 =====
FORBIDDEN = [
    "AI","인공지능","머신러닝","딥러닝","LLM","신경망","뉴럴","Transformer","파인튜닝","미세조정",
    "학습","훈련","추론","강화학습","GPT","Stable Diffusion","Diffusion",
    "PyTorch","TensorFlow","CUDA","쿠다","GPU","텐서","벡터 임베딩"
]
def _contains_forbidden(s: str) -> bool:
    s = (s or "").lower()
    return any(k.lower() in s for k in FORBIDDEN)

# ===== 텍스트 유틸 =====
_UWS   = "\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u200B"
_PUNCT = r"\-_/·•()\[\]{}:;,.!?\"'~`@#%^&*+=|\\<>"
def _normalize(s: str) -> str:
    s = (s or "").casefold()
    return re.sub(rf"[\s{_UWS}{_PUNCT}]+", "", s)
def _tokens(s: str) -> List[str]:
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
def _load_json(path: pathlib.Path, default):
    if not path.exists(): return default
    try: return json.loads(path.read_text("utf-8"))
    except: return default

def _save_json(path: pathlib.Path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), "utf-8")

def _load_hist() -> List[Dict[str, Any]]:
    return _load_json(HIST_PATH, [])

def append_history(item: Dict[str, Any]) -> None:
    arr = _load_hist(); arr.append(item)
    if len(arr) > 300: arr = arr[-300:]
    _save_json(HIST_PATH, arr)

def recent_titles_hist(limit: int = 80) -> List[str]:
    arr = _load_hist()
    return [x["title"] for x in arr[-limit:] if x.get("title")]

def recent_areas_hist(limit: int = 30) -> List[str]:
    arr = _load_hist()
    return [x["area"] for x in arr[-limit:] if x.get("area")]

# ===== Cloud 호출 =====
CODE_BLOCK_RE = re.compile(r"```(?P<lang>[a-zA-Z0-9_-]*)\s*(?P<code>[\s\S]*?)```", re.M)

def _headers_cloud() -> Dict[str, str]:
    h = {"Content-Type": "application/json"}
    if OLLAMA_BASE.startswith("https://ollama.com"):
        if not OLLAMA_API_KEY:
            raise RuntimeError("OLLAMA_API_KEY 필요")
        h["Authorization"] = f"Bearer {OLLAMA_API_KEY}"
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

def _seed_from(ym: str, attempt: int) -> int:
    h = hashlib.md5(f"{ym}:{attempt}".encode()).hexdigest()
    return int(h[:8], 16)

def _build_messages(ym: str, dedup: str) -> List[Dict[str,str]]:
    spec_rule = (
        "사양 제한: 중저사양 노트북(8–16GB RAM, 내장그래픽/iGPU)에서 한 달 내 구현 가능. "
        "GPU 전용 연산, 대규모 데이터, 실시간 고해상도 비디오/3D 렌더링 금지. "
        "AI/ML/LLM/딥러닝/모델 학습·추론·파인튜닝·외부 AI API 사용 금지."
    )
    sys_msg = (
        "너는 한국어 코딩 프로젝트 제안 생성기다. 아래 JSON 스키마로만 답하라.\n"
        "스키마:{"
        "\"area\":\"창의 주제 한 줄\","
        "\"title\":\"프로젝트 제목(최대 18자)\","
        "\"summary\":\"한 달 내 구현 가능한 범위로 문제정의/핵심기능/기술스택 가이드 포함\","
        "\"must_have\":[\"구현해야 할 Must Have 4개\"]}\n"
        f"규칙:\n- {spec_rule}\n- 오직 위 JSON만 출력."
    )
    user_msg = (
        f"[월] {ym}\n"
        "창의적인 area를 스스로 정하고, 구체적이고 실행 가능한 프로젝트를 제안하라.\n"
        f"{dedup}"
    )
    return [{"role":"system","content":sys_msg},{"role":"user","content":user_msg}]

def validate_and_norm(obj: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    if not isinstance(obj, dict): return False, {}
    area = str(obj.get("area") or obj.get("topic") or "창의 주제").strip()
    title = str(obj.get("title") or "코딩 프로젝트 제안").strip()
    summary = str(obj.get("summary") or obj.get("description") or "-").strip()
    must = obj.get("must_have") if "must_have" in obj else obj.get("must")
    if not isinstance(must, list): must = []
    must4 = [str(x).strip() for x in must if str(x).strip()][:4]
    while len(must4) < 4: must4.append(f"핵심 요구사항 {len(must4)+1}")

    if _contains_forbidden(area) or _contains_forbidden(title) or _contains_forbidden(summary):
        return False, {}

    if len(title) < 8: title = (title + " 프로젝트")[:18]
    if len(title) > 18: title = title[:18]
    summary = re.sub(r"\s{2,}", " ", summary).strip()
    return True, {"area":area,"title":title,"summary":summary,"must_have":must4}

def gen_monthly_json(ym: str, tries: int = 9, backoff: float = 0.6) -> Tuple[Dict[str, Any], str]:
    url = f"{OLLAMA_BASE}/api/chat"
    prev_titles = recent_titles_hist(80)
    recent_area = recent_areas_hist(30)

    dedup = ""
    if prev_titles: dedup += "최근 제목과 중복을 피하라. "
    if recent_area: dedup += "최근 사용 주제와 겹치지 마라."

    last_err = None
    for t in range(1, tries + 1):
        seed = _seed_from(ym, t) ^ random.getrandbits(16)
        payload = {
            "model": MODEL,
            "messages": _build_messages(ym, dedup),
            "format": "json",
            "stream": False,
            "options": {
                "num_ctx": NUM_CTX, "num_predict": MAX_NEW,
                "temperature": 0.35 + 0.05*(t-1),
                "top_p": 0.9,
                "repeat_penalty": 1.1 + 0.02*(t-1),
                "seed": int(seed),
            }
        }

        try:
            r = requests.post(url, json=payload, headers=_headers_cloud(), timeout=180)
            if r.status_code >= 400:
                last_err = RuntimeError(f"ollama_http {r.status_code}")
                time.sleep(backoff * t); continue
            data = r.json()
            content = (data.get("message") or {}).get("content") or data.get("response") or ""
        except Exception as e:
            last_err = e; time.sleep(backoff * t); continue

        parsed = None
        for cand in _extract_json_candidates(content):
            try:
                obj = json.loads(cand)
                if isinstance(obj, dict):
                    parsed = obj; break
            except Exception:
                pass
        if not parsed:
            last_err = ValueError("json_parse_fail"); time.sleep(backoff * t); continue

        ok, norm = validate_and_norm(parsed)
        if not ok:
            last_err = ValueError("schema_or_forbidden"); time.sleep(backoff * t); continue
        if not is_title_novel(norm["title"], prev_titles):
            last_err = ValueError("title_not_novel"); time.sleep(backoff * t); continue
        if not is_area_novel(norm["area"], recent_area):
            last_err = ValueError("area_not_novel"); time.sleep(backoff * t); continue

        return norm, norm["area"]

    # 폴백(경량 주제)
    return {
        "area": "경량 웹 유틸리티",
        "title": "오프라인 메모 웹앱",
        "summary": "서비스워커와 IndexedDB로 네트워크 없이 동작하는 경량 메모 앱. 태그/검색/내보내기 지원.",
        "must_have": ["오프라인 캐시","IndexedDB 동기화","태그+검색","Markdown 내보내기"],
    }, "경량 웹 유틸리티"

# ===== 업서트/MD =====
def upsert_monthly(ym: str, title: str, summary: str, must_have: List[str], md: str, api_key: str):
    url = f"{API_BASE}/api/reco/admin/upsert/topics/monthly"
    payload = {"ym": ym, "title": title, "summary": summary, "must_have": must_have, "must": must_have, "md": md}
    headers = {HEADER_KEY: api_key} if api_key else {}
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    if r.status_code >= 300: raise RuntimeError(f"worker_error {r.status_code}: {r.text[:400]}")
    try: return r.json()
    except: return {"raw": r.text}

def upsert_monthly_multi(ym: str, idx: int, title: str, summary: str, must_have: List[str], md: str, api_key: str):
    url = f"{API_BASE}/api/reco/admin/upsert/topics/monthly-multi"
    payload = {"ym": ym, "idx": int(idx), "title": title, "summary": summary, "must_have": must_have, "must": must_have, "md": md}
    headers = {HEADER_KEY: api_key} if api_key else {}
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    if r.status_code >= 300: raise RuntimeError(f"worker_error {r.status_code}: {r.text[:400]}")
    try: return r.json()
    except: return {"raw": r.text}

def build_md(ym: str, area: str, title: str, summary: str, must_have: List[str]) -> str:
    lines = [f"# {ym} 4주 코딩 프로젝트", f"**영역:** {area}", f"## {title}", "", summary or "-", "", "## Must Have(4)", ""]
    for i, s in enumerate(must_have[:4], 1):
        lines.append(f"{i}. {s}")
    return "\n".join(lines)

# ===== main =====
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ym", default=None)
    p.add_argument("--api-key", default=None)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--count", type=int, default=3)
    p.add_argument("--also-single", action="store_true")
    args = p.parse_args()

    ym = args.ym or datetime.date.today().strftime("%Y-%m")
    api_key = (args.api_key or API_KEY).strip()
    if not api_key and not args.dry_run:
        raise RuntimeError("AI_API_KEY 필요")

    results = []
    for idx in range(1, args.count + 1):
        data, area = gen_monthly_json(ym)
        title, summary, must_have = data["title"], data["summary"], data["must_have"]
        md = build_md(ym, area, title, summary, must_have)

        print(f"[diag] idx={idx} area={area} title={title} len(summary)={len(summary)}")

        if args.dry_run:
            results.append({"ym": ym, "idx": idx, "area": area, "title": title, "summary": summary, "must_have": must_have})
        else:
            try:
                resp = upsert_monthly_multi(ym, idx, title, summary, must_have, md, api_key)
                print(f"[upsert] ym={ym} idx={idx} ->", resp)
            except Exception as e:
                print(f"[upsert-error] idx={idx}: {e}")
            append_history({"ym": ym, "idx": idx, "area": area, "title": title})

            if idx == 1 and args.also_single:
                try:
                    upsert_monthly(ym, title, summary, must_have, md, api_key)
                except Exception as e:
                    print(f"[upsert-single-error]: {e}")

    if args.dry_run:
        print(json.dumps({"ym": ym, "count": args.count, "items": results}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FATAL:", e, file=sys.stderr)
        sys.exit(1)
