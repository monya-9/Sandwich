import signal
import sys
import time
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from src.config import get_tz
from src.data_ingestion import ingest_events
from src.aggregation import top_projects

LOG = logging.getLogger("scheduler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

TZ = get_tz()  # None이면 로컬시간

def job_daily():
    LOG.info("[job_daily] ingest_events -> daily top")
    ingest_events.main()
    top_projects.run("day")
    LOG.info("[job_daily] done")

def job_weekly():
    LOG.info("[job_weekly] ingest_events -> weekly top")
    ingest_events.main()
    top_projects.run("week")
    LOG.info("[job_weekly] done")

def job_health():
    LOG.info("[health] scheduler alive")

def main(run_now: bool = False):
    LOG.info("=== AI scheduler start (timezone=%s) ===", (TZ.key if TZ else "LOCAL"))
    sched = BackgroundScheduler(timezone=TZ) if TZ else BackgroundScheduler()

    # 매일 00:03
    daily_trigger  = CronTrigger(hour=0, minute=3, timezone=TZ) if TZ else CronTrigger(hour=0, minute=3)
    # 매주 월 00:10
    weekly_trigger = CronTrigger(day_of_week="mon", hour=0, minute=10, timezone=TZ) if TZ else CronTrigger(day_of_week="mon", hour=0, minute=10)

    sched.add_job(job_daily, daily_trigger, id="daily-top")
    sched.add_job(job_weekly, weekly_trigger, id="weekly-top")
    sched.add_job(job_health, "interval", minutes=5, id="health")

    sched.start()

    if run_now:
        LOG.info("[run_now] run daily & weekly now for testing")
        job_daily()
        job_weekly()

    stop = {"flag": False}
    def _graceful(signum, frame):
        LOG.info("received signal %s: shutting down...", signum)
        stop["flag"] = True

    signal.signal(signal.SIGINT, _graceful)
    signal.signal(signal.SIGTERM, _graceful)

    try:
        while not stop["flag"]:
            time.sleep(1)
    finally:
        sched.shutdown(wait=False)
        LOG.info("=== AI scheduler stopped ===")

if __name__ == "__main__":
    main(run_now=False)
