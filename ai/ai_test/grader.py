import json, subprocess, sys, time, tempfile, shutil, os, pathlib, threading, re, difflib

try:
    import psutil
except Exception:
    psutil = None

PYTHON_EXEC = sys.executable
TIMEOUT_SEC_PER_CASE = float(os.getenv("GRADER_TIMEOUT", "3.0"))

W_CORRECT, W_TIME, W_MEM = 0.70, 0.20, 0.10
TIME_BUCKETS = [(0.2, 1.0), (0.6, 0.7), (1.5, 0.3)]
MEM_BUCKETS  = [(64, 1.0), (160, 0.7), (320, 0.3)]

def score_by_buckets(val, buckets):
    for thr, s in buckets:
        if val <= thr: return s
    return 0.0

def run_one_case(pyfile: str, stdin_text: str):
    tmpdir = tempfile.mkdtemp(prefix="grade_")
    try:
        sub_path = pathlib.Path(tmpdir) / pathlib.Path(pyfile).name
        shutil.copy(pyfile, sub_path)

        env = os.environ.copy()
        env["PYTHONUTF8"] = "1"
        env["PYTHONIOENCODING"] = "utf-8"
        env.pop("PYTHONPATH", None)

        proc = subprocess.Popen(
            [PYTHON_EXEC, str(sub_path)],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            cwd=tmpdir, env=env
        )

        peak_mb = 0.0
        stop_flag = False

        def sample_mem():
            nonlocal peak_mb
            if not psutil: return
            p = psutil.Process(proc.pid)
            while not stop_flag:
                try:
                    m = p.memory_info().rss / (1024 * 1024)
                    if m > peak_mb: peak_mb = m
                except Exception:
                    break
                time.sleep(0.01)

        t_mon = threading.Thread(target=sample_mem, daemon=True)
        if psutil: t_mon.start()

        t0 = time.perf_counter()
        try:
            out, err = proc.communicate(input=stdin_text.encode("utf-8"),
                                        timeout=TIMEOUT_SEC_PER_CASE)
            ok = (proc.returncode == 0)
        except subprocess.TimeoutExpired:
            proc.kill()
            out, err = proc.communicate()
            ok = False
            err = (err or b"") + b"\n timeout"
        finally:
            stop_flag = True
            if psutil: t_mon.join(timeout=0.2)

        wall = time.perf_counter() - t0
        stdout = (out or b"").decode("utf-8", errors="replace").strip()
        stderr = (err or b"").decode("utf-8", errors="replace").strip()
        peak_val = round(peak_mb, 2) if psutil else None
        return ok, stdout, wall, peak_val, (stderr if stderr else None)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ---------- 오답 진단 ----------
_num = re.compile(r"-?\d+(?:\.\d+)?")
def _tokenize(s: str): return _num.findall(s) or s.split()
def _float_equal(a: str, b: str, eps=1e-6):
    try: return abs(float(a) - float(b)) <= eps
    except: return False

def diagnose(expected: str, got: str):
    e, g = expected, got
    if e.strip() == g.strip():
        return {"reason":"whitespace","hint":"불필요한 공백/개행 제거","cmp_mode":"strip","diff":""}
    et, gt = _tokenize(e.strip()), _tokenize(g.strip())
    if et and gt and len(et)==len(gt):
        all_num = all(t.replace('.','',1).lstrip('-').isdigit() for t in et+gt)
        if all_num and all(_float_equal(a,b) for a,b in zip(et,gt)):
            return {"reason":"format_mismatch","hint":"출력 서식(소수/공백) 정정","cmp_mode":"numeric≈","diff":""}
    if len(gt)>len(et):
        reason, hint = "extra_output", "디버그 출력 제거"
    elif len(gt)<len(et):
        reason, hint = "missing_output", "필수 출력 누락"
    else:
        reason, hint = "wrong_value", "로직 또는 자료구조 갱신 검토"
    diff = "\n".join(difflib.unified_diff(e.splitlines(), g.splitlines(), lineterm="", n=1, fromfile="expected", tofile="got"))
    return {"reason":reason,"hint":hint,"cmp_mode":"exact","diff":diff}

# ---------- 채점 ----------
def grade(submit_py: str, tests_json: str):
    spec = json.loads(pathlib.Path(tests_json).read_text(encoding="utf-8"))
    tests = spec.get("tests", [])
    results, times, mems = [], [], []
    correct_cnt = 0
    first_fail_diag = None

    for i, tc in enumerate(tests, 1):
        ok, out, wall, peak, err = run_one_case(submit_py, tc["stdin"])
        exp = (tc["stdout"] or "").strip()
        got_first = (out.splitlines()[0].strip() if out else "")
        is_correct = ok and (got_first == exp)

        if is_correct:
            correct_cnt += 1
            diag = None
        else:
            d = diagnose(exp, got_first)
            diag = {"reason": d["reason"], "hint": d["hint"], "cmp_mode": d["cmp_mode"], "diff": d["diff"][:2000]}
            if first_fail_diag is None:
                first_fail_diag = {"case": i, **diag}

        results.append({
            "case": i, "ok": ok, "expected": exp, "got": out,
            "time_sec": round(wall, 6),
            "peak_mb": (peak if peak is not None else None),
            "err": err, "diagnosis": diag
        })
        times.append(wall)
        if peak is not None: mems.append(peak)

    n = max(1, len(tests))
    acc = correct_cnt / n
    ts = sorted(times)
    t_med = ts[len(ts)//2]
    t_mean = sum(times)/len(times)
    t_p95 = ts[max(0, int(len(ts)*0.95)-1)]

    if mems:
        ms = sorted(mems)
        m_med = ms[len(ms)//2]
        m_p95 = ms[max(0, int(len(ms)*0.95)-1)]
        mem_score = score_by_buckets(m_med, MEM_BUCKETS)
        w_correct, w_time, w_mem = W_CORRECT, W_TIME, W_MEM
    else:
        m_med = m_p95 = None
        mem_score = 0.0
        s = W_CORRECT + W_TIME
        w_correct, w_time, w_mem = W_CORRECT/s, W_TIME/s, 0.0

    time_score = score_by_buckets(t_med, TIME_BUCKETS)
    passed_all = (correct_cnt == n)
    if not passed_all:
        final_score = 0.0
    else:
        final_score = 100.0 * (w_correct*acc + w_time*time_score + w_mem*mem_score)

    report = {
        "summary": {
            "submit": pathlib.Path(submit_py).name,
            "cases": n, "passed": correct_cnt, "accuracy": round(acc, 6),
            "time_med_sec": round(t_med, 6),
            "time_mean_sec": round(t_mean, 6),
            "time_p95_sec": round(t_p95, 6),
            "mem_med_mb": (round(m_med, 2) if m_med is not None else None),
            "mem_p95_mb": (round(m_p95, 2) if m_p95 is not None else None),
            "passed_all": passed_all,
            "first_fail": first_fail_diag,
            "score": round(final_score, 2)
        },
        "results": results
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python grader.py <submit.py> <tests.json>")
        sys.exit(2)
    grade(sys.argv[1], sys.argv[2])
