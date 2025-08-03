from celery import Celery

app = Celery(
    "scheduler",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2"
)
app.conf.beat_schedule = {
    "hourly-recs": {
        "task": "scheduler.tasks.run_all",
        "schedule": 3600.0,
    },
}
