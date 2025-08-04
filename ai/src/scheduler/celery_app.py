from celery import Celery

app = Celery("scheduler", broker="redis://redis:4242/1", backend="redis://redis:4242/2")

app.conf.beat_schedule = {
    "hourly-recs": {
        "task": "scheduler.tasks.refresh_recommendations",
        "schedule": 3600.0,   # 1시간마다
    },
}
