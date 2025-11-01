import json, subprocess, sys, time, tempfile, shutil, os, pathlib, threading, re, difflib

try:
    import psutil
except Exception:
    psutil = None

PYTHON_EXEC = sys.executable
TIMEOUT_SEC_PER_CASE = float(os.getenv("GRADER_TIMEOUT", "3.0"))

# ----------------- 실행기 -----------------
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
        stop = False

        def sample_mem():
            nonlocal peak_mb
            if not psutil: return
            p = psutil.Process(proc.pid)
            while not stop:
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
            out, err = proc.communicate(input=stdin_text.encode("utf-8"), timeout=TIMEOUT_SEC_PER_CASE)
            ok = (proc.returncode == 0)
        except subprocess.TimeoutExpired:
            proc.kill()
            out, err = proc.communicate()
            ok = False
            err = (err or b"") + b"\n timeout"
        finally:
            stop = True
            if psutil: t_mon.join(timeout=0.2)

        wall = time.perf_counter() - t0
        stdout = (out or b"").decode("utf-8", errors="replace").strip()
        stderr = (err or b"").decode("utf-8", errors="replace").strip()
        peak_val = round(peak_mb, 2) if psutil else None
        return ok, stdout, wall, peak_val, (stderr if stderr else None)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ----------------- 하드코딩 신호 -----------------
_num = re.compile(r"-?\d+(?:\.\d+)?")

def analyze_hardcode(src_path: pathlib.Path, expected_out_list):
    try:
        code = src_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {"penalty": 0.2, "flags": ["source_read_fail"]}

    uses_input = bool(re.search(r"\binput\s*\(", code)) or ("sys.stdin" in code)
    # 예시 출력 리터럴이 코드에 그대로 들어있는지
    literals = 0
    for out in expected_out_list:
        if not out: continue
        pat = re.escape(out.strip())
        if re.search(pat, code):
            literals += 1
    ratio = (literals / max(1, len(expected_out_list)))

    flags = []
    if not uses_input: flags.append("no_input_usage")
    if literals: flags.append(f"output_literals={literals}")

    # 페널티 0(좋음)~1(나쁨)
    if ratio >= 0.9 and not uses_input:
        pen = 1.0
    elif ratio >= 0.5:
        pen = 0.6
    elif ratio > 0.0:
        pen = 0.3
    else:
        pen = 0.1 if not uses_input else 0.0

    return {"penalty": round(pen, 3), "flags": flags}

# ----------------- 채점 -----------------
def grade(submit_py: str, tests_json: str):
    spec = json.loads(pathlib.Path(tests_json).read_text(encoding="utf-8"))
    tests = spec.get("tests", [])

    # 하드코딩 분석에 쓸 기대 출력 리스트
    expected_list = [(tc.get("stdout") or "").strip() for tc in tests]
    src_path = pathlib.Path(submit_py)
    hc = analyze_hardcode(src_path, expected_list)

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
            # 간단 진단
            if exp.strip() == got_first.strip():
                reason, hint, diff = "whitespace", "개행/공백 정리", ""
            else:
                diff = "\n".join(difflib.unified_diff(exp.splitlines(), got_first.splitlines(), lineterm="", n=1))
                reason, hint = "wrong_value", "로직/서식 확인"
            diag = {"reason": reason, "hint": hint, "diff": diff[:2000]}
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
    ts = sorted(times)
    t_med = ts[len(ts)//2]
    t_mean = sum(times)/len(times)
    t_p95 = ts[max(0, int(len(ts)*0.95)-1)]
    if mems:
        ms = sorted(mems)
        m_med = ms[len(ms)//2]
        m_p95 = ms[max(0, int(len(ms)*0.95)-1)]
    else:
        m_med = m_p95 = None

    passed_all = (correct_cnt == n)

    # 점수는 여기서 확정하지 않음. 통과/지표만 반환. 최종 점수는 batch에서 상대평가.
    report = {
        "summary": {
            "submit": pathlib.Path(submit_py).name,
            "cases": n, "passed": correct_cnt, "accuracy": round(correct_cnt/n, 6),
            "time_med_sec": round(t_med, 6),
            "time_mean_sec": round(t_mean, 6),
            "time_p95_sec": round(t_p95, 6),
            "mem_med_mb": (round(m_med, 2) if m_med is not None else None),
            "mem_p95_mb": (round(m_p95, 2) if m_p95 is not None else None),
            "passed_all": passed_all,
            "hardcode_penalty": hc["penalty"],
            "hardcode_flags": hc["flags"],
            "score": 0.0  # placeholder. grade_latest에서 계산
        },
        "results": results
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python grader.py <submit.py> <tests.json>")
        sys.exit(2)
    grade(sys.argv[1], sys.argv[2])
