import json, pathlib, datetime, sys, requests, re, random
from typing import Dict, Any, List, Optional
from weekly_prompts import WEEK_JSON_SYS, WEEK_JSON_USER

# ===== 설정 =====
OLLAMA_BASE = "http://localhost:11434"
MODEL = "qwen3:4b"
NUM_CTX = 1536
MAX_NEW_TOKENS = 300
STOP_TOKENS = ["</think>","```","[USER]","[/USER]","[/ASSISTANT]"]

AREA_HINTS = [
    "생산성(투두/메모)","학습(퀴즈/플래시카드)","건강(운동/식단)",
    "취미(사진/음악)","여행/지도(버킷리스트)","생활(가계부/영수증)",
    "편의(단위변환/QR/타이머)","독서/영화 기록"
]

HIST = pathlib.Path("out/_weekly_history.json")

# ===== 공통 =====
def _req(url, payload, timeout=600):
    r = requests.post(url, json=payload, timeout=timeout, stream=True)
    r.raise_for_status(); return r

def ollama_chat(messages, temperature=0.45, num_predict=MAX_NEW_TOKENS, fmt="json"):
    opts = {"temperature": temperature, "num_predict": num_predict, "num_ctx": NUM_CTX,
            "stop": STOP_TOKENS, "repeat_penalty": 1.12, "seed": random.randint(1, 1_000_000)}
    payload = {"model": MODEL, "messages": messages, "options": opts, "stream": True}
    if fmt: payload["format"] = fmt
    try:
        r = _req(f"{OLLAMA_BASE}/api/chat", payload)
        buf=[];
        for line in r.iter_lines():
            if not line: continue
            obj = json.loads(line);
            if "message" in obj: buf.append(obj["message"]["content"])
            if obj.get("done"): break
        return "".join(buf).strip()
    except requests.HTTPError as e:
        if not e.response or e.response.status_code != 404: raise
    # fallback
    def _fmt(msgs):
        return "\n".join(f"[{m['role'].upper()}]\n{m['content']}\n[/"+m['role'].upper()+"]" for m in messages) + "\n[ASSISTANT]\n"
    payload = {"model": MODEL, "prompt": _fmt(messages), "options": opts, "stream": True}
    if fmt: payload["format"] = fmt
    r = _req(f"{OLLAMA_BASE}/api/generate", payload)
    buf=[];
    for line in r.iter_lines():
        if not line: continue
        obj = json.loads(line);
        if "response" in obj: buf.append(obj["response"])
        if obj.get("done"): break
    return "".join(buf).strip()

def load_hist(path: pathlib.Path, k=10)->List[str]:
    if path.exists():
        try:
            d=json.loads(path.read_text(encoding="utf-8"))
            if isinstance(d,list): return d[-k:]
        except: pass
    return []

def save_hist(path: pathlib.Path, title:str):
    data = load_hist(path, 100); data.append(title.strip())
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def norm_title(t:str)->List[str]:
    t = re.sub(r"[^\w가-힣\s]", " ", t.lower())
    return [x for x in t.split() if len(x)>=2]

def novelty(title:str, recent:List[str])->float:
    a=set(norm_title(title))
    if not a: return 1.0
    sims=[]
    for r in recent:
        b=set(norm_title(r))
        sims.append(len(a&b)/len(a|b) if b else 0.0)
    return 1.0 - (max(sims) if sims else 0.0)

# ===== 렌더링 =====
def render_md(d: Dict[str,Any], week:int)->str:
    title = str(d.get("title","")).strip()
    summary = str(d.get("summary","")).strip()
    must = d.get("must_have", [])
    if not title or not summary or not isinstance(must,list) or not must:
        raise ValueError("JSON 필드 오류")
    lines=[]
    lines.append(f'**[Week {week}] AI가 제안한 주제: "{title}"**\n')
    lines.append("> 주제 설명:\n>")
    for para in re.split(r"\n{2,}", summary.strip()):
        p=para.strip().replace("\n"," ")
        if p: lines.append(f"> {p}\n>")
    lines.append("> 필수 기능:")
    for s in must[:5]:
        s=str(s).strip()
        if s: lines.append(f"> - {s}")
    lines.append("")
    return "\n".join(lines)

# ===== 생성 =====
def main():
    # ISO 주차
    today = datetime.date.today()
    _, week, _ = today.isocalendar()
    if len(sys.argv)>=2:
        try: week=int(sys.argv[1])
        except: pass
    area_hint = sys.argv[2] if len(sys.argv)>=3 else None

    recent = load_hist(HIST, 10)
    best=None; best_score=-1.0
    for _ in range(6):
        hint = area_hint or random.choice(AREA_HINTS)
        raw = ollama_chat(
            [{"role":"system","content": WEEK_JSON_SYS},
             {"role":"user","content": WEEK_JSON_USER(week, hint, recent)}],
            temperature=0.5, num_predict=MAX_NEW_TOKENS, fmt="json"
        )
        try:
            d=json.loads(raw); t=str(d.get("title","")).strip()
            if not t: continue
            score=novelty(t, recent)
            if score>best_score: best, best_score = d, score
        except:
            continue
    if not best:
        raise RuntimeError("주간 주제 생성 실패")

    md = render_md(best, week)
    outdir = pathlib.Path("out"); outdir.mkdir(exist_ok=True)
    path = outdir/f"week-{week:02d}.md"
    path.write_text(md, encoding="utf-8")
    save_hist(HIST, str(best.get("title","")))
    print("saved ->", path)

if __name__ == "__main__":
    main()
