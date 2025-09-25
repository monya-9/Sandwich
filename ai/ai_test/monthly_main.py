import json, pathlib, datetime, sys, requests, re, random
from typing import Dict, Any, List, Optional
from monthly_prompts import MONTH_JSON_SYS, MONTH_JSON_USER

OLLAMA_BASE = "http://localhost:11434"
MODEL = "qwen3:4b"
NUM_CTX = 2048
MAX_NEW_TOKENS = 420
STOP_TOKENS = ["</think>","```","[USER]","[/USER]","[/ASSISTANT]"]
AREA_HINTS = ["협업", "지식관리", "생산성", "교육", "커뮤니티", "데이터 시각화", "창작/디자인"]

HIST = pathlib.Path("out/_monthly_history.json")

def _req(url, payload, timeout=600):
    r = requests.post(url, json=payload, timeout=timeout, stream=True)
    r.raise_for_status(); return r

def ollama_chat(messages, temperature=0.4, num_predict=MAX_NEW_TOKENS, fmt="json"):
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

def load_hist(path: pathlib.Path, k=6)->List[str]:
    if path.exists():
        try:
            d=json.loads(path.read_text(encoding="utf-8"))
            if isinstance(d,list): return d[-k:]
        except: pass
    return []

def save_hist(path: pathlib.Path, title:str):
    data = load_hist(path, 50); data.append(title.strip())
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def norm_title(t:str)->List[str]:
    t = re.sub(r"[^\w가-힣\s]", " ", t.lower())
    return [x for x in t.split() if len(x)>=2]

def novelty(title:str, recent:List[str])->float:
    a=set(norm_title(title));
    if not a: return 1.0
    sims=[]
    for r in recent:
        b=set(norm_title(r))
        sims.append(len(a&b)/len(a|b) if b else 0.0)
    return 1.0 - (max(sims) if sims else 0.0)

# ===== 렌더링 =====
def render_md(d: Dict[str,Any], ym:str)->str:
    title = str(d.get("title","")).strip()
    summary = str(d.get("summary","")).strip()
    must = d.get("must_have", [])
    if not title or not summary or not isinstance(must,list) or not must:
        raise ValueError("JSON 필드 오류")
    lines=[]
    lines.append(f'**[{ym}] AI가 제안한 프로젝트 주제: "{title}"**\n')
    lines.append("> 주제 설명:\n>")
    for para in re.split(r"\n{2,}", summary.strip()):
        p=para.strip().replace("\n"," ")
        if p: lines.append(f"> {p}\n>")
    lines.append("> 필수 기능:")
    for s in must[:6]:
        s=str(s).strip()
        if s: lines.append(f"> - {s}")
    lines.append("")
    return "\n".join(lines)

def main():
    today = datetime.date.today()
    ym = today.strftime("%Y-%m")
    if len(sys.argv)>=2: ym = sys.argv[1]  # 예: 2025-10
    recent = load_hist(HIST, 6)

    best=None; best_score=-1.0
    for _ in range(6):
        hint = random.choice(AREA_HINTS)
        raw = ollama_chat(
            [{"role":"system","content": MONTH_JSON_SYS},
             {"role":"user","content": MONTH_JSON_USER(ym, hint, recent)}],
            temperature=0.42, num_predict=MAX_NEW_TOKENS, fmt="json"
        )
        try:
            d=json.loads(raw); t=str(d.get("title","")).strip()
            if not t: continue
            score = novelty(t, recent)
            if score>best_score: best, best_score = d, score
        except:
            continue
    if not best:
        raise RuntimeError("월간 주제 생성 실패")
    md = render_md(best, ym)
    outdir = pathlib.Path("out"); outdir.mkdir(exist_ok=True)
    path = outdir/f"monthly-{ym}.md"
    path.write_text(md, encoding="utf-8")
    save_hist(HIST, str(best.get("title","")))
    print("saved ->", path)

if __name__ == "__main__":
    main()
