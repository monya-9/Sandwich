import os, json, pathlib, datetime, argparse, time, hashlib, random, re
from typing import List, Dict, Any, Tuple, Iterable
import requests
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env", override=False)

# Ollama
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
MODEL       = os.getenv("MONTHLY_MODEL", "qwen3:4b")
NUM_CTX     = int(os.getenv("MONTHLY_NUM_CTX", "2048"))
MAX_NEW     = int(os.getenv("MONTHLY_MAX_NEW_TOKENS", "420"))

# Worker API
API_BASE   = os.getenv("API_BASE", "https://api.dnutzs.org")
API_KEY    = (os.getenv("AI_API_KEY") or os.getenv("X_AI_API_KEY") or "").strip()
HEADER_KEY = os.getenv("AI_HEADER", "X-AI-API-Key")

OUT_DIR    = pathlib.Path("out"); OUT_DIR.mkdir(exist_ok=True)
HIST_PATH  = OUT_DIR / "_monthly_history.json"

from monthly_prompts import MONTH_JSON_SYS, MONTH_JSON_USER, AREA_HINTS

# ---------- IO ----------
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
    _save_json(HIST_PATH, arr)

def recent_titles(limit: int = 80) -> List[str]:
    arr = _load_hist()
    return [x["title"] for x in arr[-limit:] if x.get("title")]

def used_areas_recent(cycle_len: int) -> List[str]:
    arr = _load_hist()
    used = [x.get("area") for x in arr[-cycle_len:] if x.get("area")]
    return [a for a in used if isinstance(a, str)]

# ---------- AREA 선택(무작위+로테이션) ----------
def pick_area() -> str:
    cycle_len = max(1, len(AREA_HINTS))
    used = set(used_areas_recent(cycle_len))
    candidates = [a for a in AREA_HINTS if a not in used] or AREA_HINTS[:]  # 모두 사용되면 리셋
    return random.choice(candidates)

# ---------- 유사성 필터 ----------
_UWS   = "\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u200B"
_PUNCT = r"\-_/·•()\[\]{}:;,.!?\"'~`@#%^&*+=|\\<>"
_norm_re = re.compile(rf"[\s{_UWS}{_PUNCT}]+", re.UNICODE)

def _normalize(s: str) -> str:
    s = (s or "").casefold()
    s = _norm_re.sub("", s)
    return s

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

def is_title_novel(title: str, prev_titles: List[str]) -> bool:
    for p in prev_titles:
        if _jaccard(_char_ngrams(title), _char_ngrams(p)) >= 0.55: return False
        if _jaccard(_tokens(title), _tokens(p)) >= 0.55: return False
    return True

# ---------- 스키마 ----------
def _soften_summary(s: str) -> str:
    s = s.replace("목표로 한다.", "을 목표로 해요.")
    s = s.replace("제공한다.", "제공해요.")
    s = s.replace("구현한다.", "만들어요.")
    s = re.sub(r"\s{2,}", " ", s).strip()
    return s

def _to_list4(must: Any) -> List[str]:
    if not isinstance(must, list): must = []
    out: List[str] = []
    for x in must:
        s = str(x).strip()
        if s: out.append(s)
    while len(out) < 4: out.append(f"핵심 요구사항 {len(out)+1}")
    return out[:4]

def validate_and_norm(obj: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    if not isinstance(obj, dict): return False, {}
    title = str(obj.get("title") or "").strip() or "코딩 프로젝트 제안"
    summary = str(obj.get("summary") or obj.get("description") or "-").strip() or "-"
    must4 = _to_list4(obj.get("must_have") if "must_have" in obj else obj.get("must"))
    if len(title) < 8: title = (title + " 프로젝트")[:18]
    if len(title) > 18: title = title[:18]
    summary = _soften_summary(summary)
    return True, {"title": title, "summary": summary, "must_have": must4}

# ---------- Ollama ----------
def _seed_from(ym: str, attempt: int) -> int:
    h = hashlib.md5(f"{ym}:{attempt}".encode()).hexdigest()
    return int(h[:8], 16)

def gen_monthly_json(ym: str, tries: int = 7, backoff: float = 0.6) -> Tuple[Dict[str, Any], str]:
    url = f"{OLLAMA_BASE}/api/generate"
    prev_titles = recent_titles(80)

    last_err = None
    for t in range(1, tries + 1):
        area = pick_area()  # 매 시도마다 무작위(로테이션 후보)
        seed = _seed_from(ym, t) ^ random.getrandbits(16)
        temperature    = 0.16 + 0.06 * (t - 1)
        repeat_penalty = 1.15 + 0.05 * (t - 1)

        prompt = f"{MONTH_JSON_SYS}\n\n{MONTH_JSON_USER(ym, area, prev_titles, used_areas_recent(len(AREA_HINTS)))}"
        payload = {
            "model": MODEL,
            "prompt": prompt,
            "format": "json",
            "options": {
                "num_ctx": NUM_CTX,
                "num_predict": MAX_NEW,
                "temperature": temperature,
                "top_p": 0.9,
                "repeat_penalty": repeat_penalty,
                "seed": int(seed),
            },
            "stream": False,
        }

        r = requests.post(url, json=payload, timeout=120)
        if r.status_code != 200:
            last_err = RuntimeError(f"ollama_http status={r.status_code} body={r.text[:300]}")
            time.sleep(backoff * t); continue

        try:
            resp = r.json().get("response", "")
            data = json.loads(resp) if isinstance(resp, str) else resp
            ok, norm = validate_and_norm(data)
            if not ok:
                last_err = ValueError("schema_invalid"); time.sleep(backoff * t); continue

            if not is_title_novel(norm["title"], prev_titles):
                last_err = ValueError("title_not_novel"); time.sleep(backoff * t); continue

            return norm, area
        except Exception as e:
            last_err = e; time.sleep(backoff * t)

    # 폴백
    return {
        "title": "코딩 프로젝트 제안",
        "summary": "한 달 안에 핵심 흐름을 보여줄 수 있도록 범위를 좁힌 MVP를 정의해요.",
        "must_have": ["핵심 요구사항 1","핵심 요구사항 2","핵심 요구사항 3","핵심 요구사항 4"],
    }, pick_area()

# ---------- 업서트 ----------
def upsert_monthly(ym: str, title: str, summary: str, must_have: List[str], md: str, api_key: str):
    url = f"{API_BASE}/api/reco/admin/upsert/topics/monthly"
    payload = {
        "ym": ym,
        "title": (title or "").strip() or "코딩 프로젝트 제안",
        "summary": (summary or "").strip() or "-",
        "must_have": must_have or [],
        "must": must_have or [],
        "md": md if isinstance(md, str) else "",
    }
    headers = {HEADER_KEY: api_key} if api_key else {}
    r = requests.post(url, json=payload, headers=headers, timeout=30)

    try:
        resp_json = r.json()
    except ValueError:
        resp_json = {"raw": r.text}

    if r.status_code >= 400 or (isinstance(resp_json, dict) and resp_json.get("ok") is False):
        raise RuntimeError(f"worker_error status={r.status_code} body={r.text[:500]}")

    return resp_json

# ---------- MD ----------
def build_md(ym: str, area: str, title: str, summary: str, must_have: List[str]) -> str:
    lines = [f"# {ym} 4주 코딩 프로젝트", f"**영역:** {area}", f"## {title}", "", summary or "-", "", "## Must Have(4)", ""]
    for i, s in enumerate(must_have[:4], 1):
        lines.append(f"{i}. {s}")
    return "\n".join(lines)

# ---------- main ----------
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ym", help="YYYY-MM", default=None)
    p.add_argument("--api-key", help="X-AI-API-Key 미지정 시 .env", default=None)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    ym = args.ym or datetime.date.today().strftime("%Y-%m")
    api_key = (args.api_key or API_KEY).strip()
    if not api_key and not args.dry_run:
        raise RuntimeError("AI_API_KEY 필요")

    data, area = gen_monthly_json(ym)

    title, summary, must_have = data["title"], data["summary"], data["must_have"]
    print("[diag] area:", area)
    print("[diag] title:", title)
    print("[diag] summary.len:", len(summary))
    print("[diag] must_have.count:", len(must_have))

    md = build_md(ym, area, title, summary, must_have)

    if args.dry_run:
        print(json.dumps({"ym": ym, "area": area, "title": title, "summary": summary, "must_have": must_have}, ensure_ascii=False, indent=2))
        return

    resp = upsert_monthly(ym, title, summary, must_have, md, api_key)
    append_history({"ym": ym, "area": area, "title": title, "summary": summary, "must_have": must_have, "resp": resp})
    print("[monthly] upsert ok:", resp)

if __name__ == "__main__":
    main()
