import os
import sys
import time
import signal
import logging
import datetime as dt
from pathlib import Path

# 경로
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except Exception:
    pass


# 로깅
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "scheduler.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger("scheduler")


# 락 파일: 중복 실행 방지
LOCK_FILE = LOG_DIR / "pipeline.lock"

def acquire_lock() -> bool:
    if LOCK_FILE.exists():
        try:
            age = time.time() - LOCK_FILE.stat().st_mtime
            if age > 2 * 3600:
                log.warning("stale lock detected (>2h). removing...")
                LOCK_FILE.unlink(missing_ok=True)
            else:
                return False
        except Exception:
            return False
    try:
        LOCK_FILE.write_text(str(os.getpid()), encoding="utf-8")
        return True
    except Exception:
        return False

def release_lock():
    try:
        if LOCK_FILE.exists():
            LOCK_FILE.unlink(missing_ok=True)
    except Exception:
        pass


def sleep_until_top_of_next_hour():
    now = dt.datetime.now()
    nxt = (now.replace(minute=0, second=0, microsecond=0) + dt.timedelta(hours=1))
    secs = (nxt - now).total_seconds()
    time.sleep(max(1, int(secs)))

_stop = False
def _handle_signal(signum, frame):
    global _stop
    _stop = True
    log.info(f"received signal {signum}. will stop after current cycle…")

for sig in (signal.SIGINT, getattr(signal, "SIGTERM", signal.SIGINT)):
    try:
        signal.signal(sig, _handle_signal)
    except Exception:
        pass

def main():

    while not _stop:
        os.environ["TRAIN_ON_RUN"] = os.environ.get("TRAIN_ON_RUN", "0")

        if not acquire_lock():
            log.info("another run is in progress. skip this cycle.")
        else:
            try:
                log.info("running pipeline…")

                from src.pipeline.run_once import main as run_once
                run_once()
                log.info("pipeline finished.")
            except Exception as e:
                log.exception(f"pipeline error: {e}")
            finally:
                release_lock()

        if _stop:
            break
        sleep_until_top_of_next_hour()

    log.info("scheduler stopped.")

if __name__ == "__main__":
    main()
