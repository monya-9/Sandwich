import os, sys, json, csv, re, io, zipfile, time, pathlib, subprocess
import urllib.request, urllib.error
from urllib.parse import urlparse, unquote

# ---------------- paths ----------------
ROOT = pathlib.Path(__file__).resolve().parent
CASE_DIR  = ROOT / "case"
TESTS_DIR = ROOT / "tests"
OUT_DIR   = ROOT / "out"
IN_DIR    = ROOT / "in"
for d in (CASE_DIR, TESTS_DIR, OUT_DIR, IN_DIR):
    d.mkdir(exist_ok=True)
HISTORY = OUT_DIR / "_weekly_history.json"
GRADER  = str(ROOT / "grader.py")
PY      = sys.executable

# ---------------- .env ----------------
def _load_env_file():
    for p in (ROOT.parent / ".env", ROOT / ".env", pathlib.Path.cwd() / ".env"):
        if p.exists():
            env={}
            for line in p.read_text(encoding="utf-8").splitlines():
                line=line.strip()
                if not line or line.startswith("#") or "=" not in line: continue
                k,v=line.split("=",1)
                env[k.strip()]=v.strip().strip('"').strip("'")
            return env
    return {}
_ENV = _load_env_file()
def getenv(k, d=""):
    return os.getenv(k, _ENV.get(k, d))

def _build_ingest_url():
    u = getenv("INGEST_URL","").strip()
    if u: return u
    base = getenv("WORKER_BASE","").strip()
    if not base: return ""
    return (base[:-1] if base.endswith("/") else base) + "/api/reco/judge/ingest"

INGEST_URL  = _build_ingest_url()
AI_HEADER   = getenv("AI_HEADER", "x-api-key")
AI_API_KEY  = getenv("AI_API_KEY", "")
MAIN_DB_URL = getenv("MAIN_DB_URL", "")

# ---------------- week helpers ----------------
def _norm_week(s: str) -> str:
    s = "" if s is None else str(s)
    return s.strip().replace("-", "").upper()  # e.g., '2025W43'

# ---------------- history ----------------
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
    print(f"[history] latest.week={week} ts={latest.get('ts')}")
    return week, latest

def find_summary_for(week: str, idx: int) -> str:
    if not HISTORY.exists(): return ""
    data = json.loads(HISTORY.read_text(encoding="utf-8"))
    data_sorted = sorted(data, key=lambda x: x.get("ts",""), reverse=True)
    latest = next((it for it in data_sorted if it.get("week")==week), data_sorted[0])

    # 형태1: problems 배열 우선
    probs = latest.get("problems")
    if isinstance(probs, list):
        hit = next((p for p in probs if int(p.get("idx",-1))==idx), None)
        if hit and hit.get("summary"): return hit["summary"]

    # 형태2: 개별 항목(idx 포함) 탐색
    for it in data_sorted:
        if it.get("week")==week and str(it.get("idx","")).isdigit() and int(it["idx"])==idx:
            if it.get("summary"): return it["summary"]

    # 폴백
    return latest.get("summary","")

# ---------------- test extraction ----------------
IN_TAG  = re.compile(r"(예시|예제|sample|example)\s*입력\s*:?", re.IGNORECASE)
OUT_TAG = re.compile(r"(예시|예제|sample|example)\s*출력\s*:?", re.IGNORECASE)

def _take_until(text, start_pos, next_pat):
    m = next_pat.search(text, pos=start_pos)
    end = m.start() if m else len(text)
    return text[start_pos:end]

def extract_examples(summary: str):
    """
    summary에서 예시 입력/출력을 뽑아 tests 리스트로 만든다.
    포맷:
      예시 입력:
      <여러 줄 입력...>
      예시 출력:
      <다음 줄 또는 첫 번째 비어있지 않은 줄에 정답>

    예전처럼 '예시 출력: 2' 한 줄에 나오는 경우와
    W47처럼 다음 줄에 나오는 경우 둘 다 지원.
    """
    s = (summary or "").replace("\r\n","\n")
    tests = []
    ins = list(IN_TAG.finditer(s))
    outs = list(OUT_TAG.finditer(s))

    for im in ins:
        # 이 입력 이후에 나오는 첫 번째 출력 태그 찾기
        om = next((o for o in outs if o.start() > im.end()), None)

        # 입력 블록: 입력 태그 이후 ~ 다음 출력 태그 이전까지
        block = _take_until(s, im.end(), OUT_TAG).strip("\n ")
        if block and not block.endswith("\n"):
            block += "\n"

        # 출력값 추출
        out_tok = ""
        if om:
            # 출력 태그 이후의 텍스트를 줄 단위로 나눈다
            rest_lines = s[om.end():].splitlines()

            # 1) 첫 줄에서 숫자/토큰 시도 (예: "예시 출력: 2" 형식)
            if rest_lines:
                first = rest_lines[0].strip()
                if first:
                    mnum = re.search(r"-?\d+(?:\.\d+)?", first)
                    if mnum:
                        out_tok = mnum.group(0)
                    else:
                        out_tok = first.split()[0]

            # 2) 첫 줄이 비어 있거나 숫자가 없으면
            #    이후 첫 번째 비어있지 않은 줄에서 숫자/토큰 찾기
            if not out_tok:
                for line in rest_lines[1:]:
                    line = line.strip()
                    if not line:
                        continue
                    mnum = re.search(r"-?\d+(?:\.\d+)?", line)
                    if mnum:
                        out_tok = mnum.group(0)
                    else:
                        out_tok = line.split()[0]
                    break

        if block and out_tok:
            tests.append({"stdin": block, "stdout": out_tok})

    # 중복 제거
    uniq, seen = [], set()
    for t in tests:
        k = (t["stdin"], t["stdout"])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(t)
    return uniq

def write_tests(week: str, tests):
    if not tests:
        # 여기서 바로 죽으니까 .json이 안 만들어졌던 것.
        # extract_examples가 개선되면 정상 생성됨.
        raise RuntimeError("no example tests found in summary")
    dst = TESTS_DIR / f"{week}.json"
    dst.write_text(json.dumps({"tests": tests}, ensure_ascii=False, indent=2), encoding="utf-8")
    return dst

# ---------------- DB utils ----------------
CANDIDATES = {
    "userid":     ["userid","user_id","user","member_id","account_id"],
    "repo_url":   ["repo_url","repository_url","repo","repo_uri","git_url"],
    "commit_sha": ["commit_sha","sha","commit","commit_id","revision"],
    "file_path":  ["file_path","path","entrypoint","main","filename","filepath","source_path"],
}
WEEK_COL_CANDS = ["week", "week_id", "iso_week"]
IDX_COL_CANDS  = ["selected_idx", "sel_idx", "problem_idx", "idx"]

def _open_conn(url):
    u = urlparse(url); scheme = (u.scheme or "").lower()
    if scheme.startswith("postgres"):
        import psycopg2
        conn = psycopg2.connect(url); kind="pg"
    elif scheme.startswith(("mysql","mariadb")):
        import pymysql
        user = unquote(u.username or ""); pwd = unquote(u.password or "")
        host = u.hostname or "localhost"; port = u.port or 3306; db=(u.path or "/").lstrip("/")
        conn = pymysql.connect(host=host, port=port, user=user, password=pwd, database=db,
                               charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)
        kind="my"
    elif scheme.startswith("sqlite"):
        import sqlite3
        dbp = u.path
        if u.netloc: dbp = f"//{u.netloc}{u.path}"
        conn = sqlite3.connect(dbp); conn.row_factory = sqlite3.Row; kind="sq"
    else:
        raise RuntimeError(f"unsupported MAIN_DB_URL scheme: {scheme}")
    return kind, conn

def _list_columns(kind, conn, view):
    if kind == "pg":
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {view} LIMIT 0")
            return [d.name for d in cur.description]
    elif kind == "my":
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {view} LIMIT 0")
            return [d[0] for d in cur.description]
    else:
        cur = conn.execute(f"SELECT * FROM {view} LIMIT 0")
        return [d[0] for d in cur.description]

def _detect_cols(kind, conn, view="ai_read_submissions"):
    cols = _list_columns(kind, conn, view)
    lower = {c.lower(): c for c in cols}
    mapping = {}
    for need, cands in CANDIDATES.items():
        found = None
        for c in cands:
            if c.lower() in lower: found = lower[c.lower()]; break
        if not found:
            raise RuntimeError(f"missing column for '{need}' in view; have={cols}")
        mapping[need] = found
    print(f"[export] columns in {view}: {cols}")
    return mapping

def _run_query(kind, conn, sql, params):
    rows=[]
    if kind == "pg":
        import psycopg2.extras
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute(sql, params); rows=[dict(r) for r in cur.fetchall()]
    elif kind == "my":
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, params); rows=list(cur.fetchall())
    else:
        with conn:
            cur = conn.execute(sql, params); rows=[dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def _norm_week_where(kind, col):
    if kind=="pg":
        return f"REPLACE(UPPER(TRIM({col})),'-','') = %(week)s"
    elif kind=="my":
        return f"REPLACE(UPPER(TRIM({col})),'-','') = %s"
    else:
        return f"REPLACE(UPPER(TRIM({col})),'-','') = ?"

def fetch_selected_idx_from_view(week: str):
    """뷰에서 해당 주차의 selected_idx가 있으면 하나 읽어온다. 없으면 None."""
    if not MAIN_DB_URL: return None
    kind, conn = _open_conn(MAIN_DB_URL)
    view = "ai_read_submissions"
    have = set(c.lower() for c in _list_columns(kind, conn, view))
    # 선택 컬럼 없으면 종료
    idx_col = next((c for c in IDX_COL_CANDS if c in have), None)
    if not idx_col: conn.close(); return None
    week_col = next((c for c in WEEK_COL_CANDS if c in have), None)
    norm = _norm_week(week)
    if not week_col: conn.close(); return None

    where = _norm_week_where(kind, week_col)
    sql = f"SELECT {idx_col} AS selected_idx FROM {view} WHERE {where} LIMIT 1"
    params = {"week": norm} if kind=="pg" else (norm,)
    rows = _run_query(kind, conn, sql, params)
    if not rows: return None
    try:
        v = int(str(rows[0]["selected_idx"]).strip())
        return v if 1 <= v <= 3 else None
    except Exception:
        return None

def fetch_rows_from_view(week: str, active_idx: int):
    if not MAIN_DB_URL:
        print("[export] skip: MAIN_DB_URL not set"); return []
    norm = _norm_week(week)
    if not norm:
        print(f"[export] abort: invalid week value -> {week!r}")
        return []

    kind, conn = _open_conn(MAIN_DB_URL)
    view = "ai_read_submissions"
    mapping = _detect_cols(kind, conn, view)
    # reopen for query
    kind, conn = _open_conn(MAIN_DB_URL)
    have = set(c.lower() for c in _list_columns(kind, conn, view))

    week_col = next((c for c in WEEK_COL_CANDS if c in have), None)
    idx_col  = next((c for c in IDX_COL_CANDS  if c in have), None)

    sel = ", ".join(f'{mapping[k]} AS {k}' for k in ("userid","repo_url","commit_sha","file_path"))
    wheres = []; pg_params = {}; seq_params=[]

    if week_col:
        wheres.append(_norm_week_where(kind, week_col))
        (pg_params.__setitem__("week", norm) if kind=="pg" else seq_params.append(norm))

    if idx_col:
        if kind=="pg":
            wheres.append(f"{idx_col} = %(idx)s"); pg_params["idx"]=active_idx
        elif kind=="my":
            wheres.append(f"{idx_col} = %s"); seq_params.append(active_idx)
        else:
            wheres.append(f"{idx_col} = ?"); seq_params.append(active_idx)

    where_sql = (" WHERE " + " AND ".join(wheres)) if wheres else ""
    sql = f"SELECT {sel} FROM {view}{where_sql}"
    params = pg_params if kind=="pg" else tuple(seq_params)
    print(f"[export] week filter on {week_col or 'N/A'}: param={norm}, idx={active_idx if idx_col else 'N/A'}")
    rows = _run_query(kind, conn, sql, params)
    print(f"[export] rows fetched: {len(rows)} (week={week}, idx={active_idx})")
    return rows

# ---------------- GitHub ZIP download + extract ----------------
def _parse_github(repo_url: str):
    u = urlparse(repo_url.strip())
    host = (u.netloc or "").lower()
    if "github.com" not in host: return None, None
    parts = [p for p in (u.path or "").split("/") if p]
    if len(parts) < 2: return None, None
    owner, repo = parts[0], parts[1].split("/")[0].removesuffix(".git")
    return owner, repo

def _http_get(url, timeout=25, retries=2):
    last=None
    for i in range(retries+1):
        try:
            req = urllib.request.Request(url, headers={
                "user-agent":"judge-zip/1.0",
                "accept":"application/zip, */*;q=0.1",
            })
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read(), resp.geturl(), getattr(resp, "status", 200)
        except urllib.error.HTTPError as e:
            if e.code in (429,403) and i<retries:
                time.sleep(1.2*(i+1)); last=e; continue
            body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {url} | {body}") from None
        except Exception as e:
            last=e
            if i<retries: time.sleep(0.5*(i+1))
            else: raise
    raise last

def _download_repo_zip(repo_url: str, ref: str, timeout=25) -> bytes:
    owner, repo = _parse_github(repo_url)
    if not owner: raise RuntimeError(f"not_github_repo_url: {repo_url}")
    candidates = [
        f"https://codeload.github.com/{owner}/{repo}/zip/{ref}",
        f"https://github.com/{owner}/{repo}/archive/{ref}.zip",
    ]
    last_err=None
    for u in candidates:
        try:
            data, final_url, status = _http_get(u, timeout=timeout)
            print(f"[zip] OK {status} {final_url}")
            return data
        except Exception as e:
            print(f"[zip] FAIL {u} | {e}")
            last_err=e
    # branch fallbacks
    for br in ("main","master"):
        for base in (f"https://codeload.github.com/{owner}/{repo}/zip/{br}",
                     f"https://github.com/{owner}/{repo}/archive/{br}.zip"):
            try:
                data, final_url, status = _http_get(base, timeout=timeout)
                print(f"[zip] OK {status} {final_url}")
                return data
            except Exception as e:
                print(f"[zip] FAIL {base} | {e}")
                last_err=e
    raise last_err or RuntimeError("zip_download_failed")

def _extract_python_from_zip(zip_bytes: bytes, entrypoint: str):
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    names = [n for n in zf.namelist() if not n.endswith("/")]
    if not names: raise FileNotFoundError("empty_zip")
    def rel(n): t=n.split("/",1); return t[1] if len(t)>1 else n

    entry = (entrypoint or "").strip().lstrip("./")
    entry_rel = entry.split("/",1)[-1]
    base = os.path.basename(entry_rel)
    probes = [entry_rel] if "." in base else [entry_rel+".py", entry_rel]

    # (a) suffix match
    for p in probes:
        for full in names:
            if rel(full).endswith(p):
                with zf.open(full) as f: return f.read().decode("utf-8","replace"), full
    # (b) basename
    for p in probes:
        b = os.path.basename(p)
        cands=[full for full in names if os.path.basename(full)==b]
        if cands:
            pick=min(cands, key=lambda n: len(rel(n)))
            with zf.open(pick) as f: return f.read().decode("utf-8","replace"), pick
    # (c) keyword .py
    keywords=("main","app","solution","python_main","solve")
    py=[f for f in names if f.lower().endswith(".py")]
    kw=[f for f in py if any(k in os.path.basename(f).lower() for k in keywords)]
    bucket = kw or py
    if bucket:
        pick=min(bucket, key=lambda n: ("/" in rel(n), len(rel(n))))
        with zf.open(pick) as f: return f.read().decode("utf-8","replace"), pick
    raise FileNotFoundError(f"no_python_in_zip (files={len(names)})")

# ---------------- sync submissions ----------------
def _s(row, key):
    v = row.get(key, "")
    return "" if v is None else str(v).strip()

def sync_submissions(rows):
    """
    rows: [{'userid','repo_url','commit_sha','file_path',('language')}...]
    ZIP을 받아 엔트리포인트 기준으로 .py를 추출해 case/<userid>.py로 저장
    """
    if not rows:
        print("[sync] no rows"); return
    written = 0
    for r in rows:
        userid     = _s(r, "userid")
        repo_url   = _s(r, "repo_url")
        commit_sha = _s(r, "commit_sha")
        entry      = _s(r, "file_path") or _s(r, "entrypoint") or "main.py"
        lang       = (_s(r, "language") or "python").lower()

        # python만
        if lang not in ("py","python",""):
            print(f"[sync] skip non-python: user={userid} lang='{lang}'"); continue
        if not userid or not repo_url or not commit_sha:
            print(f"[sync] skip missing ids: {r}"); continue

        try:
            zip_bytes = _download_repo_zip(repo_url, commit_sha)
            code, picked = _extract_python_from_zip(zip_bytes, entry)
        except Exception as e:
            # branch 폴백
            tried_err = e
            code = None
            for ref in ("main","master"):
                try:
                    zip_bytes = _download_repo_zip(repo_url, ref)
                    code, picked = _extract_python_from_zip(zip_bytes, entry)
                    break
                except Exception as e2:
                    tried_err = e2
            if code is None:
                print(f"[sync] zip/extract failed: user={userid} entry='{entry}' | {tried_err}")
                continue

        (CASE_DIR / f"{userid}.py").write_text(code, encoding="utf-8")
        written += 1
        print(f"[sync] wrote case/{userid}.py via ZIP -> {picked}")
    print(f"[sync] done. files={written}")

# ---------------- grading ----------------
def grade_one(submit_path: pathlib.Path, tests_json: pathlib.Path):
    env = os.environ.copy(); env["PYTHONUTF8"]="1"; env["PYTHONIOENCODING"]="utf-8"
    p = subprocess.run([PY, GRADER, str(submit_path), str(tests_json)],
                       capture_output=True, text=False, env=env)
    stdout = (p.stdout or b"").decode("utf-8", errors="replace")
    if p.returncode != 0 and not stdout:
        stderr = (p.stderr or b"").decode("utf-8", errors="replace")
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":stderr.strip()}}
    try:
        return json.loads(stdout)
    except Exception as e:
        stderr = (p.stderr or b"").decode("utf-8", errors="replace")
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":f"bad_json:{e} | {stderr.strip()}"}}

# ---------------- ranking ----------------
def rank_and_score(summaries):
    passed = [s for s in summaries if s.get("passed_all")]
    if not passed:
        return [(i+1, s, 0.0) for i,s in enumerate(sorted(summaries, key=lambda x:(-x.get("accuracy",0.0), x.get("submit",""))))]
    min_time = min(float(s.get("time_med_sec", 1e9)) for s in passed)
    mem_present = any(s.get("mem_med_mb") is not None for s in passed)
    min_mem = min(float(s.get("mem_med_mb", 1e9)) for s in passed if s.get("mem_med_mb") is not None) if mem_present else None
    def calc_score(s):
        if not s.get("passed_all"): return 0.0
        t = float(s.get("time_med_sec", 1e9)); time_norm = min_time / t if t>0 else 1.0
        if min_mem is None or s.get("mem_med_mb") is None:
            mem_norm = 1.0; w_time, w_mem, w_code = 0.7, 0.0, 0.3
        else:
            m = float(s.get("mem_med_mb", 1e9)); mem_norm = min_mem / m if m>0 else 1.0
            w_time, w_mem, w_code = 0.6, 0.3, 0.1
        code_norm = 1.0 - float(s.get("hardcode_penalty", 0.0))
        return round(max(0.0, min(100.0, 100.0*(w_time*time_norm + w_mem*mem_norm + w_code*code_norm))), 2)
    for s in summaries: s["score"] = calc_score(s)
    def sort_key(s):
        def _asc(v): return float("inf") if v is None else v
        return (-float(s.get("score",0.0)), _asc(s.get("time_med_sec")), _asc(s.get("mem_med_mb")), s.get("submit",""))
    ranked = sorted(summaries, key=sort_key)
    return [(i+1, s, s["score"]) for i, s in enumerate(ranked)]

# ---------------- ingest ----------------
def ingest_payload(payload: dict):
    if not INGEST_URL: print("INGEST_SKIPPED: set WORKER_BASE or INGEST_URL"); return
    if not AI_API_KEY: print("INGEST_SKIPPED: set AI_API_KEY"); return
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"content-type":"application/json", AI_HEADER: AI_API_KEY, "user-agent":"judge-ingest/1.0"}
    req = urllib.request.Request(INGEST_URL, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            print("INGEST:", resp.status, resp.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as e:
        print(f"INGEST_FAILED_HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}")
    except urllib.error.URLError as e:
        print(f"INGEST_FAILED_URL: {e}")

# ---------------- main ----------------
def main():
    # 1) 최신 주차
    week, latest = load_latest_entry()

    # 2) active idx 결정: 히스토리 → 뷰 → ENV → 1
    idx_from_hist = latest.get("selected_idx")
    idx_from_view = fetch_selected_idx_from_view(week)
    idx_from_env  = getenv("WEEKLY_ACTIVE_IDX","").strip()
    active_idx = None
    for cand in (idx_from_hist, idx_from_view, idx_from_env):
        try:
            v = int(str(cand).strip())
            if 1 <= v <= 3:
                active_idx = v; break
        except Exception:
            pass
    if active_idx is None: active_idx = 1
    print(f"[select] week={week} idx={active_idx} (hist={idx_from_hist}, view={idx_from_view}, env={idx_from_env or None})")

    # 3) 뷰에서 주차+idx 제출 조회
    rows = fetch_rows_from_view(week, active_idx)

    # 4) 제출 동기화
    sync_submissions(rows)

    # 5) 선택 idx summary로 테스트 생성
    summary = find_summary_for(week, active_idx)
    tests = extract_examples(summary)
    tests_json = write_tests(week, tests)

    # 6) 채점
    summaries, results_payload = [], []
    for sub in sorted(CASE_DIR.glob("*.py")):
        rep = grade_one(sub, tests_json)
        (OUT_DIR / f"{sub.stem}_{week}.json").write_text(json.dumps(rep, ensure_ascii=False, indent=2), encoding="utf-8")
        s = rep.get("summary", {}); s["_user"] = sub.stem; summaries.append(s)
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
        print(f"OK week={week} idx={active_idx} | submissions=0 | tests={tests_json}")
        return

    # 7) 상대평가·리더보드
    ranked = rank_and_score(summaries)
    lb = OUT_DIR / f"leaderboard_{week}.csv"
    with lb.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank","user","score","time_med_sec","mem_med_mb","hardcode_penalty"])
        for rank, s, sc in ranked:
            w.writerow([rank, s["_user"], sc, s.get("time_med_sec"), s.get("mem_med_mb"), s.get("hardcode_penalty")])

    # 8) 업서트
    payload = {
        "week": week,
        "leaderboard": [
            {"user": s["_user"], "rank": rank, "score": sc,
             "accuracy": float(s.get("accuracy", 0.0) or 0.0),
             "time_med_sec": s.get("time_med_sec", None),
             "time_mean_sec": s.get("time_mean_sec", None),
             "time_p95_sec": s.get("time_p95_sec", None),
             "mem_med_mb": s.get("mem_med_mb", None),
             "mem_p95_mb": s.get("mem_p95_mb", None)}
            for rank, s, sc in ranked
        ],
        "results": results_payload
    }
    ingest_payload(payload)
    print(f"OK week={week} idx={active_idx} -> {lb} | tests={tests_json}")

if __name__ == "__main__":
    main()
