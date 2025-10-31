import os
import sys
import logging
import subprocess
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import importlib.util

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# ── 경로 ───────────────────────────────────────────────
# 이 파일: <PROJECT_ROOT>/src/scheduler/scheduler.py
HERE = Path(__file__).resolve()
SRC_DIR = HERE.parents[1]            # <PROJECT_ROOT>/src
ROOT = SRC_DIR.parent                # <PROJECT_ROOT>
AI_DIR = ROOT / "ai_test"

PATH_RUN_ONCE     = SRC_DIR / "pipeline"    / "run_once.py"
PATH_TOP_PROJECTS = SRC_DIR / "aggregation" / "top_projects.py"
PATH_WEEKLY       = AI_DIR / "weekly_main.py"
PATH_MONTHLY      = AI_DIR / "monthly_main.py"
PATH_GRADE_LATEST = AI_DIR / "grade_latest.py"

# ── 로깅 ───────────────────────────────────────────────
LOGS = ROOT / "logs"
LOGS.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.FileHandler(LOGS / "scheduler.log", encoding="utf-8"),
              logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger("scheduler")

# ── TZ ────────────────────────────────────────────────
TZ = ZoneInfo(os.getenv("TZ", "Asia/Seoul"))

# ── 동적 import 유틸 ───────────────────────────────────
def import_by_path(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, str(file_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"spec 생성 실패: {file_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[attr-defined]
    return mod

# ── 공용 실행 유틸 ─────────────────────────────────────
def safe_call(desc: str, fn, *args, **kwargs):
    """잡에서 사용. 실패해도 스케줄러는 계속."""
    log.info("▶ %s 시작", desc)
    try:
        fn(*args, **kwargs)
        log.info("✔ %s 완료", desc)
    except SystemExit as e:
        code = getattr(e, "code", 0)
        if code not in (0, None):
            log.exception("✖ %s 종료 코드=%s", desc, code)
            raise
        log.info("✔ %s 정상 종료(SystemExit 0)", desc)
    except Exception:
        log.exception("✖ %s 실패", desc)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()

def strict_call(desc: str, fn, *args, **kwargs):
    """기동 전 점검에서 사용. 예외 발생 시 바로 전파."""
    log.info("▶ %s 시작", desc)
    try:
        fn(*args, **kwargs)
        log.info("✔ %s 완료", desc)
    except SystemExit as e:
        code = getattr(e, "code", 0)
        if code not in (0, None):
            log.exception("✖ %s 종료 코드=%s", desc, code)
            raise
        log.info("✔ %s 정상 종료(SystemExit 0)", desc)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()

def run_script(path: Path, *args: str):
    """ai_test/* 서브프로세스 실행."""
    cmd = [sys.executable, str(path), *args]
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{ROOT}{os.pathsep}{env.get('PYTHONPATH','')}"
    log.info("▶ 프로세스 실행: %s", " ".join(cmd))
    res = subprocess.run(cmd, cwd=str(ROOT), env=env, capture_output=True, text=True)
    if res.stdout:
        log.info("[stdout]\n%s", res.stdout.rstrip())
    if res.stderr:
        log.info("[stderr]\n%s", res.stderr.rstrip())
    if res.returncode != 0:
        raise RuntimeError(f"{path.name} 실패 rc={res.returncode}")

# ── 잡 구현 ───────────────────────────────────────────
def job_top_projects_day():
    mod = import_by_path("top_projects", PATH_TOP_PROJECTS)
    if hasattr(mod, "run"):
        safe_call("top_projects run('day')", mod.run, "day")
    elif hasattr(mod, "main"):
        safe_call("top_projects main()", mod.main)
    else:
        raise AttributeError("top_projects에 run 또는 main 없음")

def job_run_once_hourly():
    mod = import_by_path("run_once", PATH_RUN_ONCE)
    if hasattr(mod, "main"):
        safe_call("run_once main()", mod.main)
    elif hasattr(mod, "run"):
        safe_call("run_once run()", mod.run)
    else:
        raise AttributeError("run_once에 main 또는 run 없음")

def job_weekly_main():
    run_script(PATH_WEEKLY)

def job_monthly_main():
    run_script(PATH_MONTHLY)

def job_grade_latest():
    run_script(PATH_GRADE_LATEST)

# ── 기동 전 1회 점검(게이트) ───────────────────────────
def startup_gate():
    # 1) run_once 1회 실행
    mod_run_once = import_by_path("run_once__startup", PATH_RUN_ONCE)
    if hasattr(mod_run_once, "main"):
        strict_call("startup: run_once main()", mod_run_once.main)
    elif hasattr(mod_run_once, "run"):
        strict_call("startup: run_once run()", mod_run_once.run)
    else:
        raise AttributeError("run_once에 main 또는 run 없음")

    # 2) top_projects 1회 실행(day)
    mod_tp = import_by_path("top_projects__startup", PATH_TOP_PROJECTS)
    if hasattr(mod_tp, "run"):
        strict_call("startup: top_projects run('day')", mod_tp.run, "day")
    elif hasattr(mod_tp, "main"):
        strict_call("startup: top_projects main()", mod_tp.main)
    else:
        raise AttributeError("top_projects에 run 또는 main 없음")

# ── 스케줄 설정 ───────────────────────────────────────
def main():
    log.info("스케줄러 기동 TZ=%s now=%s", TZ, datetime.now(TZ).isoformat())

    # 기동 전 1회 점검. 실패 시 종료.
    try:
        startup_gate()
    except Exception:
        log.exception("✖ 기동 전 점검 실패. 스케줄러 시작하지 않음.")
        sys.exit(1)

    sch = BlockingScheduler(timezone=TZ)

    # 1) top_projects: 매일 00:10
    sch.add_job(job_top_projects_day,
                trigger=CronTrigger(hour=0, minute=10, timezone=TZ),
                id="top_projects_day", replace_existing=True)

    # 2) run_once: 매시 정각
    sch.add_job(job_run_once_hourly,
                trigger=CronTrigger(minute=0, timezone=TZ),
                id="run_once_hourly", replace_existing=True)

    # 3) weekly_main: 매주 월요일 01:00
    sch.add_job(job_weekly_main,
                trigger=CronTrigger(day_of_week="mon", hour=1, minute=0, timezone=TZ),
                id="weekly_main_mon_0100", replace_existing=True)

    # 4) monthly_main: 매월 1일 01:30
    sch.add_job(job_monthly_main,
                trigger=CronTrigger(day="1", hour=1, minute=30, timezone=TZ),
                id="monthly_main_1st_0130", replace_existing=True)

    # 5) grade_latest: 매주 일요일 18:00
    sch.add_job(job_grade_latest,
                trigger=CronTrigger(day_of_week="sun", hour=18, minute=0, timezone=TZ),
                id="grade_latest_sun_1800", replace_existing=True)

    try:
        sch.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("스케줄러 종료 요청 수신")

if __name__ == "__main__":
    main()
