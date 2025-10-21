import json, csv, re, subprocess, sys, pathlib, os, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
CASE_DIR = ROOT / "case"
TESTS_DIR = ROOT / "tests"
OUT_DIR = ROOT / "out"
TESTS_DIR.mkdir(exist_ok=True)
OUT_DIR.mkdir(exist_ok=True)

HISTORY = OUT_DIR / "_weekly_history.json"
GRADER = str(ROOT / "grader.py")
PY = sys.executable

# ---- .env 로딩 ----
def load_env_file():
    candidates = [ROOT.parent / ".env", ROOT / ".env", pathlib.Path.cwd() / ".env"]
    env = {}
    for p in candidates:
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
            break
    return env

ENV_FILE = load_env_file()

def getenv(key: str, default: str = "") -> str:
    return os.getenv(key, ENV_FILE.get(key, default))

def build_ingest_url():
    # 우선순위: INGEST_URL > WORKER_BASE
    url = getenv("INGEST_URL", "").strip()
    if url:
        return url
    base = getenv("WORKER_BASE", "").strip()  # 예: https://api.dnutzs.org
    if not base:
        return ""
    # 슬래시 정규화
    if base.endswith("/"):
        base = base[:-1]
    return base + "/api/reco/judge/ingest"

INGEST_URL = build_ingest_url()
AI_HEADER  = getenv("AI_HEADER", "x-api-key")
AI_API_KEY = getenv("AI_API_KEY", "")

# ---- 예시 파서 ----
IN_TAG  = re.compile(r"(예시|예제|sample|example)\s*입력\s*:?", re.IGNORECASE)
OUT_TAG = re.compile(r"(예시|예제|sample|example)\s*출력\s*:?", re.IGNORECASE)

def load_latest_entry():
    if not HISTORY.exists():
        raise FileNotFoundError(f"missing {HISTORY}")
    data = json.loads(HISTORY.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise RuntimeError("weekly_history empty or invalid")
    data.sort(key=lambda x: x.get("ts",""), reverse=True)
    latest = data[0]
    week = latest.get("week")
    if not week:
        raise RuntimeError("week not found in latest history entry")
    return week, latest

def _take_until(text, start_pos, next_pat):
    m = next_pat.search(text, pos=start_pos)
    end = m.start() if m else len(text)
    return text[start_pos:end]

def extract_examples(summary: str):
    s = summary.replace("\r\n", "\n")
    tests = []
    inputs = list(IN_TAG.finditer(s))
    outputs = list(OUT_TAG.finditer(s))
    for im in inputs:
        in_block = _take_until(s, im.end(), OUT_TAG).strip("\n ")
        if in_block and not in_block.endswith("\n"):
            in_block += "\n"
        om = next((cand for cand in outputs if cand.start() > im.end()), None)
        if not om:
            continue
        line = s[om.end():].split("\n", 1)[0].strip()
        mnum = re.search(r"-?\d+", line)
        out_tok = mnum.group(0) if mnum else (line.split()[0] if line else "")
        if in_block and out_tok:
            tests.append({"stdin": in_block, "stdout": out_tok})
    uniq, seen = [], set()
    for t in tests:
        k = (t["stdin"], t["stdout"])
        if k in seen: continue
        seen.add(k); uniq.append(t)
    return uniq

def write_tests(week: str, tests):
    if not tests:
        raise RuntimeError("no example tests found in summary")
    dst = TESTS_DIR / f"{week}.json"
    dst.write_text(json.dumps({"tests": tests}, ensure_ascii=False, indent=2), encoding="utf-8")
    return dst

# ---- 채점 래퍼 ----
def grade_one(submit_path: pathlib.Path, tests_json: pathlib.Path):
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    p = subprocess.run([PY, GRADER, str(submit_path), str(tests_json)],
                       capture_output=True, text=False, env=env)
    stdout = (p.stdout or b"").decode("utf-8", errors="replace")
    stderr = (p.stderr or b"").decode("utf-8", errors="replace")
    if p.returncode != 0 and not stdout:
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":stderr.strip()}}
    try:
        return json.loads(stdout)
    except Exception as e:
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":f"bad_json:{e} | {stderr.strip()}"}}

def sort_key(s):
    def _asc(v): return float("inf") if v is None else v
    return (
        -float(s.get("score", 0.0)),
        -float(s.get("accuracy", 0.0)),
        _asc(s.get("time_med_sec")),
        _asc(s.get("time_mean_sec")),
        _asc(s.get("time_p95_sec")),
        _asc(s.get("mem_med_mb")),
        s.get("submit","")
    )

# ---- 인제스트(needKey 방식) ----
def ingest_payload(payload: dict):
    if not INGEST_URL:
        print("INGEST_SKIPPED: set WORKER_BASE or INGEST_URL")
        return
    if not AI_API_KEY:
        print("INGEST_SKIPPED: set AI_API_KEY in env or .env")
        return
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"content-type": "application/json", AI_HEADER: AI_API_KEY}
    req = urllib.request.Request(INGEST_URL, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=25) as resp:
        print("INGEST:", resp.status, resp.read().decode("utf-8", errors="replace"))

def main():
    week, latest = load_latest_entry()
    tests = extract_examples(latest.get("summary", ""))
    tests_json = write_tests(week, tests)

    summaries = []
    results_payload = []

    for sub in sorted(CASE_DIR.glob("*.py")):
        rep = grade_one(sub, tests_json)
        (OUT_DIR / f"{sub.stem}_{week}.json").write_text(
            json.dumps(rep, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        s = rep.get("summary", {})
        s["_user"] = sub.stem
        summaries.append(s)

        if s.get("passed_all"):
            results_payload.append({"user": sub.stem, "passed_all": True, "message": "정답입니다!"})
        else:
            ff = s.get("first_fail") or {}
            results_payload.append({
                "user": sub.stem, "passed_all": False,
                "message": f"[실패] 케이스 {ff.get('case','?')}: {ff.get('hint','원인 분석 불가')}",
                "first_fail_case": ff.get("case"),
                "reason": ff.get("reason"),
                "hint": ff.get("hint"),
                "diff": ff.get("diff")
            })

    if not summaries:
        print(f"OK week={week} | submissions=0 | tests={tests_json}")
        return

    ranked = sorted(summaries, key=sort_key)

    # CSV 리더보드
    lb = OUT_DIR / f"leaderboard_{week}.csv"
    with lb.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank","user","score","accuracy","time_med_sec","time_mean_sec","time_p95_sec","mem_med_mb","mem_p95_mb"])
        for i, s in enumerate(ranked, 1):
            w.writerow([i, s["_user"], s.get("score"), s.get("accuracy"), s.get("time_med_sec"),
                        s.get("time_mean_sec"), s.get("time_p95_sec"), s.get("mem_med_mb"), s.get("mem_p95_mb")])

    payload = {
        "week": week,
        "leaderboard": [
            {
              "user": s["_user"], "rank": i+1,
              "score": s.get("score",0.0), "accuracy": s.get("accuracy",0.0),
              "time_med_sec": s.get("time_med_sec"),
              "time_mean_sec": s.get("time_mean_sec"),
              "time_p95_sec": s.get("time_p95_sec"),
              "mem_med_mb": s.get("mem_med_mb"),
              "mem_p95_mb": s.get("mem_p95_mb"),
            } for i, s in enumerate(ranked)
        ],
        "results": results_payload
    }
    try:
        ingest_payload(payload)
    except Exception as e:
        print("INGEST_FAILED:", e)

    print(f"OK week={week} -> {lb} | tests={tests_json}")

if __name__ == "__main__":
    main()
