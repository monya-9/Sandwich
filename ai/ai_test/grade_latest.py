import json, csv, re, subprocess, sys, pathlib, os, urllib.request
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, unquote
import io, zipfile, urllib.request, os, time

ROOT = pathlib.Path(__file__).resolve().parent
CASE_DIR = ROOT / "case"
TESTS_DIR = ROOT / "tests"
OUT_DIR = ROOT / "out"
IN_DIR = ROOT / "in"
for d in (CASE_DIR, TESTS_DIR, OUT_DIR, IN_DIR): d.mkdir(exist_ok=True)

HISTORY = OUT_DIR / "_weekly_history.json"
GRADER = str(ROOT / "grader.py")
PY = sys.executable

# ---------- .env ----------
def load_env_file():
    for p in (ROOT.parent / ".env", ROOT / ".env", pathlib.Path.cwd() / ".env"):
        if p.exists():
            env = {}
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line: continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
            return env
    return {}
ENV_FILE = load_env_file()

PY_FALLBACKS = ["main.py", "app.py", "solution.py", "python_main.py", "src/main.py", "src/app.py"]

def _try_urls(urls, timeout=15):
    last_err = None
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={"user-agent":"judge-sync/1.0","accept":"text/plain"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="replace"), u
        except Exception as e:
            last_err = e
    raise last_err

def _is_probably_python_path(p: str) -> bool:
    return p.endswith(".py") or p.endswith("/.py")  # 오타 방지

def _normalize_path(p: str) -> str:
    p = p.strip().lstrip("./")
    return p

def _s(row, key):
    v = row.get(key, "")
    return "" if v is None else str(v).strip()

def getenv(k, d=""): return os.getenv(k, ENV_FILE.get(k, d))

def build_ingest_url():
    u = getenv("INGEST_URL", "").strip()
    if u: return u
    base = getenv("WORKER_BASE", "").strip()
    if not base: return ""
    return (base[:-1] if base.endswith("/") else base) + "/api/reco/judge/ingest"

INGEST_URL = build_ingest_url()
AI_HEADER  = getenv("AI_HEADER", "x-api-key")
AI_API_KEY = getenv("AI_API_KEY", "")
MAIN_DB_URL = getenv("MAIN_DB_URL", "")  # 필수

# 뷰·쿼리
SUBMISSIONS_SQL_BASE = "SELECT userid, repo_url, commit_sha, file_path FROM ai_read_submissions"
VIEW_WEEK_COLUMN = getenv("VIEW_WEEK_COLUMN", "").strip()  # 예: "week" (없으면 전체)

# ---------- 예시 파서 ----------
IN_TAG  = re.compile(r"(예시|예제|sample|example)\s*입력\s*:?", re.IGNORECASE)
OUT_TAG = re.compile(r"(예시|예제|sample|example)\s*출력\s*:?", re.IGNORECASE)

def load_latest_entry():
    if not HISTORY.exists(): raise FileNotFoundError(f"missing {HISTORY}")
    data = json.loads(HISTORY.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data: raise RuntimeError("weekly_history empty or invalid")
    data.sort(key=lambda x: x.get("ts",""), reverse=True)
    latest = data[0]
    week = latest.get("week")
    if not week: raise RuntimeError("week not found in latest history entry")
    return week, latest

def _take_until(text, start_pos, next_pat):
    m = next_pat.search(text, pos=start_pos); end = m.start() if m else len(text)
    return text[start_pos:end]

def extract_examples(summary: str):
    s = summary.replace("\r\n","\n")
    tests, ins, outs = [], list(IN_TAG.finditer(s)), list(OUT_TAG.finditer(s))
    for im in ins:
        block = _take_until(s, im.end(), OUT_TAG).strip("\n ")
        if block and not block.endswith("\n"): block += "\n"
        om = next((o for o in outs if o.start() > im.end()), None)
        if not om: continue
        line = s[om.end():].split("\n",1)[0].strip()
        mnum = re.search(r"-?\d+", line)
        out_tok = mnum.group(0) if mnum else (line.split()[0] if line else "")
        if block and out_tok: tests.append({"stdin": block, "stdout": out_tok})
    uniq, seen = [], set()
    for t in tests:
        k=(t["stdin"], t["stdout"])
        if k in seen: continue
        seen.add(k); uniq.append(t)
    return uniq

def write_tests(week: str, tests):
    if not tests: raise RuntimeError("no example tests found in summary")
    dst = TESTS_DIR / f"{week}.json"
    dst.write_text(json.dumps({"tests": tests}, ensure_ascii=False, indent=2), encoding="utf-8")
    return dst

# --- replace in ai_test/grade_latest.py ---

CANDIDATES = {
    "userid":     ["userid","user_id","user","member_id","account_id"],
    "repo_url":   ["repo_url","repository_url","repo","repo_uri","git_url"],
    "commit_sha": ["commit_sha","sha","commit","commit_id","revision"],
    "file_path":  ["file_path","path","entrypoint","main","filename","filepath","source_path"],
}


def _open_conn(url):
    from urllib.parse import urlparse, unquote
    u = urlparse(url); scheme = u.scheme.lower()
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

def _detect_cols(kind, conn, view_name="ai_read_submissions"):
    """
    반환: {"userid": "user_id", "repo_url": "repo_url", ...}
    """
    mapping = {}
    try:
        if kind == "pg":
            import psycopg2.extras
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute(f'SELECT * FROM {view_name} LIMIT 0')
                cols = [d.name for d in cur.description]
        elif kind == "my":
            with conn.cursor() as cur:
                cur.execute(f'SELECT * FROM {view_name} LIMIT 0')
                cols = [d[0] for d in cur.description]
        else:  # sqlite
            cur = conn.execute(f'SELECT * FROM {view_name} LIMIT 0')
            cols = [d[0] for d in cur.description]
    except Exception as e:
        raise RuntimeError(f"introspect failed: {e}")

    lower = {c.lower(): c for c in cols}
    for need, cands in CANDIDATES.items():
        found = None
        for c in cands:
            if c.lower() in lower:
                found = lower[c.lower()]; break
        if not found:
            raise RuntimeError(f"missing column for '{need}' in view; have={cols}")
        mapping[need] = found
    return mapping
def _list_columns(kind, conn, view):
    if kind == "pg":
        import psycopg2.extras
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

def _norm_week(s: str) -> str:
    if not s: return ""
    s = str(s).strip()
    s = s.replace("-", "")
    s = s.upper()
    return s  # 예: "2025W43"

WEEK_COL_CANDS = ["week", "week_id", "iso_week"]

def fetch_rows_from_view(week: str):
    if not MAIN_DB_URL:
        print("[export] skip: MAIN_DB_URL not set"); return []

    kind, conn = _open_conn(MAIN_DB_URL)  # 기존 함수 그대로 사용
    view = "ai_read_submissions"

    # 기존 컬럼 매핑 감지( userid/repo_url/commit_sha/file_path )
    mapping = _detect_cols(kind, conn, view)

    # 주차 컬럼 결정: ENV 우선, 없으면 자동 탐지
    env_week = getenv("VIEW_WEEK_COLUMN", "").strip().lower() or None
    have_cols = set(c.lower() for c in _list_columns(kind, conn, view))  # 아래 보조 함수 추가
    week_col = None
    if env_week and env_week in have_cols:
        week_col = env_week
    else:
        for c in WEEK_COL_CANDS:
            if c in have_cols:
                week_col = c; break

    # SELECT 본문
    sel = ", ".join(f'{mapping[k]} AS {k}' for k in ("userid","repo_url","commit_sha","file_path"))
    norm = _norm_week(week)

    if week_col:
        if kind == "pg":
            # TRIM(=공백 제거) + UPPER + REPLACE('-','')로 컬럼 정규화 후 비교
            where = f" WHERE REPLACE(UPPER(TRIM({week_col})),'-','') = %(week)s"
            params = {"week": norm}
        elif kind == "my":
            where = f" WHERE REPLACE(UPPER(TRIM({week_col})),'-','') = %s"
            params = (norm,)
        else:  # sqlite
            where = f" WHERE REPLACE(UPPER(TRIM({week_col})),'-','') = ?"
            params = (norm,)
    else:
        where, params = "", ()

    sql = f"SELECT {sel} FROM {view}{where}"
    rows = _run_query(kind, conn, sql, params)  # 기존 실행부 호출
    print(f"[export] rows fetched: {len(rows)} (week={week}{'' if week_col else ', no_week_filter'})")
    print(f"[export] week filter on {week_col}: param={norm}")

    return rows


# ---------- 제출 동기화 ----------
def _parse_github(repo_url: str):
    u = urlparse(repo_url.strip())
    host = (u.netloc or "").lower()
    if "github.com" not in host: return None, None
    parts = [p for p in (u.path or "").split("/") if p]
    # owner/repo만 취하고 뒤는 버린다. (/tree/main 같은 것 제거)
    if len(parts) < 2: return None, None
    owner, repo = parts[0], parts[1]
    repo = repo.removesuffix(".git")
    # 가끔 repo 뒤에 ".git/"가 더 붙음 → 정리
    repo = repo.split("/")[0]
    return owner, repo

def _http_get(url, timeout=25, retries=2):
    last = None
    for i in range(retries+1):
        try:
            req = urllib.request.Request(url, headers={
                "user-agent":"judge-zip/1.0",
                "accept":"application/zip, */*;q=0.1",
            })
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read(), resp.geturl(), resp.status
        except urllib.error.HTTPError as e:
            # 429/403은 짧게 재시도
            if e.code in (429, 403) and i < retries:
                time.sleep(1.2*(i+1))
                last = e
                continue
            # 내용도 로깅
            body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {url} | {body}") from None
        except Exception as e:
            last = e
            if i < retries: time.sleep(0.5*(i+1))
            else: raise
    raise last

def _download_repo_zip(repo_url: str, ref: str, timeout=25):
    owner, repo = _parse_github(repo_url)
    if not owner:
        raise RuntimeError(f"not_github_repo_url: {repo_url}")
    # 시도 순서: codeload → archive. ref가 짧으면 그대로도 시도.
    candidates = [
        f"https://codeload.github.com/{owner}/{repo}/zip/{ref}",
        f"https://github.com/{owner}/{repo}/archive/{ref}.zip",
    ]
    last_err = None
    for u in candidates:
        try:
            data, final_url, status = _http_get(u, timeout=timeout)
            print(f"[zip] OK {status} {final_url}")
            return data
        except Exception as e:
            print(f"[zip] FAIL {u} | {e}")
            last_err = e
    # 브랜치 폴백
    for br in ("main","master"):
        for base in (f"https://codeload.github.com/{owner}/{repo}/zip/{br}",
                     f"https://github.com/{owner}/{repo}/archive/{br}.zip"):
            try:
                data, final_url, status = _http_get(base, timeout=timeout)
                print(f"[zip] OK {status} {final_url}")
                return data
            except Exception as e:
                print(f"[zip] FAIL {base} | {e}")
                last_err = e
    raise last_err or RuntimeError("zip_download_failed")

def _extract_by_basename(zip_bytes: bytes, entrypoint: str):
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    names = [n for n in zf.namelist() if not n.endswith("/")]
    base = os.path.basename((entrypoint or "").strip()) or "main.py"
    probes = [base] if "." in base else [base + ".py", base]
    # repo-<ref>/... 접두 폴더 제거 기준으로 가장 짧은 경로 선택
    def rel(n): t = n.split("/",1); return t[1] if len(t)>1 else n
    cands = [n for n in names if os.path.basename(n) in probes]
    if not cands:
        raise FileNotFoundError(f"entry_not_found:{probes} in ZIP (files={len(names)})")
    pick = min(cands, key=lambda n: len(rel(n)))
    with zf.open(pick) as f:
        return f.read().decode("utf-8", errors="replace"), pick

def _raw_url_from_repo(repo_url: str, commit_sha: str, file_path: str) -> list[str]:
    """
    토큰 없이 가능한 후보 URL들. 앞에서부터 시도.
    - github.com/.../raw/<ref>/<path>  ← 짧은 SHA OK (리다이렉트)
    - raw.githubusercontent.com/.../<ref>/<path>
    - 브랜치 폴백(main, master)
    """
    owner, repo = _parse_github(repo_url)
    path = (file_path or "").lstrip("/")
    if owner and repo:
        base_web = f"https://github.com/{owner}/{repo}/raw"
        base_raw = f"https://raw.githubusercontent.com/{owner}/{repo}"
        ref = commit_sha.strip()
        urls = [
            f"{base_web}/{ref}/{path}",
            f"{base_raw}/{ref}/{path}",
            f"{base_web}/main/{path}",
            f"{base_raw}/main/{path}",
            f"{base_web}/master/{path}",
            f"{base_raw}/master/{path}",
        ]
        # 중복 제거
        seen=set(); return [u for u in urls if not (u in seen or seen.add(u))]
    # GitLab/Bitbucket은 기존 그대로
    u = urlparse(repo_url); host = (u.netloc or "").lower()
    parts = [p for p in (u.path or "").split("/") if p]
    if len(parts) < 2: return []
    owner, repo = parts[0], parts[1].removesuffix(".git")
    if "gitlab.com" in host:
        return [f"https://gitlab.com/{owner}/{repo}/-/raw/{commit_sha}/{path}"]
    if "bitbucket.org" in host:
        return [f"https://bitbucket.org/{owner}/{repo}/raw/{commit_sha}/{path}"]
    return []

# 추가: _fetch_from_codeload_zip()
import io, zipfile, urllib.request

def _fetch_from_codeload_zip(repo_url: str, ref: str, path: str, timeout=20):
    """https://codeload.github.com/<owner>/<repo>/zip/<ref>에서 ZIP 내려받아 path 파일만 추출."""
    owner, repo = _parse_github(repo_url)
    if not owner: raise RuntimeError("not github")
    url = f"https://codeload.github.com/{owner}/{repo}/zip/{ref}"
    req = urllib.request.Request(url, headers={"user-agent":"judge-sync/1.0","accept":"application/zip"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    zf = zipfile.ZipFile(io.BytesIO(data))
    # 아카이브 최상위 폴더명은 <repo>-<shortsha or ref>/* 형태
    norm = path.lstrip("/")
    # 경로 후보: 최상위 폴더를 무시하고 매칭
    # 예: repo-abc123/src/main.py → src/main.py 비교
    for name in zf.namelist():
        try_rel = "/".join(name.split("/")[1:])  # drop top-level dir
        if try_rel == norm:
            with zf.open(name) as f:
                return f.read().decode("utf-8", errors="replace")
    raise FileNotFoundError(f"{path} not in zip")

def _download_text(url: str, timeout=15) -> str:
    req = urllib.request.Request(url, headers={"user-agent": "judge-sync/1.0","accept":"text/plain, */*;q=0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")

def sync_submissions(rows):
    if not rows:
        print("[sync] no rows"); return
    written = 0
    for r in rows:
        userid     = _s(r, "userid")
        repo_url   = _s(r, "repo_url")
        commit_sha = _s(r, "commit_sha")
        entry      = _s(r, "file_path") or _s(r, "entrypoint") or "main.py"
        lang       = (_s(r, "language") or "python").lower()
        if lang not in ("py","python",""):
            continue
        if not userid or not repo_url or not commit_sha:
            print(f"[sync] skip missing ids: {r}"); continue

        # ref 후보: commit_sha → main → master
        refs = [commit_sha, "main", "master"]
        code = None; picked = None
        last_err = None
        for ref in refs:
            try:
                zip_bytes = _download_repo_zip(repo_url, ref)
                code, picked = _extract_by_basename(zip_bytes, entry)
                break
            except Exception as e:
                last_err = e
                continue
        try:
            zip_bytes = _download_repo_zip(repo_url, commit_sha)  # 여기 로그가 원인 알려줌
            code, picked = _extract_by_basename(zip_bytes, entry)
        except Exception as e:
            print(f"[sync] zip/extract failed: user={userid} ref={commit_sha} entry={entry} | {e}")
            continue

        (CASE_DIR / f"{userid}.py").write_text(code, encoding="utf-8")
        written += 1
        print(f"[sync] wrote case/{userid}.py via ZIP -> {picked}")
    print(f"[sync] done. files={written}")




# ---------- 채점 ----------
def grade_one(submit_path: pathlib.Path, tests_json: pathlib.Path):
    env = os.environ.copy(); env["PYTHONUTF8"]="1"; env["PYTHONIOENCODING"]="utf-8"
    p = subprocess.run([PY, GRADER, str(submit_path), str(tests_json)], capture_output=True, text=False, env=env)
    stdout = (p.stdout or b"").decode("utf-8", errors="replace")
    if p.returncode != 0 and not stdout:
        stderr = (p.stderr or b"").decode("utf-8", errors="replace")
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":stderr.strip()}}
    try:
        return json.loads(stdout)
    except Exception as e:
        stderr = (p.stderr or b"").decode("utf-8", errors="replace")
        return {"summary":{"submit":submit_path.name,"score":0.0,"error":f"bad_json:{e} | {stderr.strip()}"}}

# ---------- 상대평가 ----------
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

# ---------- 업서트 ----------
def ingest_payload(payload: dict):
    if not INGEST_URL: print("INGEST_SKIPPED: set WORKER_BASE or INGEST_URL"); return
    if not AI_API_KEY: print("INGEST_SKIPPED: set AI_API_KEY"); return
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"content-type":"application/json", AI_HEADER: AI_API_KEY, "user-agent":"judge-ingest/1.0"}
    req = urllib.request.Request(INGEST_URL, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            print("INGEST:", resp.status, resp.read().decode("utf-8", errors="replace"))
    except HTTPError as e:
        print(f"INGEST_FAILED_HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}")
    except URLError as e:
        print(f"INGEST_FAILED_URL: {e}")

def main():
    # 1) 최신 주차
    week, latest = load_latest_entry()

    # 2) 메인 DB 뷰에서 행 조회
    rows = fetch_rows_from_view(week)

    # 3) 제출 동기화(원격 파일 → case/<userid>.py)
    sync_submissions(rows)

    # 4) 테스트 생성
    tests = extract_examples(latest.get("summary", ""))
    tests_json = write_tests(week, tests)

    # 5) 채점
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
        print(f"OK week={week} | submissions=0 | tests={tests_json}")
        return

    # 6) 상대평가·리더보드
    ranked = rank_and_score(summaries)
    lb = OUT_DIR / f"leaderboard_{week}.csv"
    with lb.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank","user","score","time_med_sec","mem_med_mb","hardcode_penalty"])
        for rank, s, sc in ranked:
            w.writerow([rank, s["_user"], sc, s.get("time_med_sec"), s.get("mem_med_mb"), s.get("hardcode_penalty")])

    # 7) 업서트
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
    print(f"OK week={week} -> {lb} | tests={tests_json}")

if __name__ == "__main__":
    main()
