import os, json, time
import requests

WORKER_BASE = os.getenv("WORKER_BASE", "https://api.dnutzs.org")
AI_HEADER   = os.getenv("AI_HEADER", "X-AI-API-Key")
AI_API_KEY  = os.getenv("AI_API_KEY", "")

def _post(path: str, payload: dict):
    url = f"{WORKER_BASE}{path}"
    r = requests.post(url, json=payload, headers={AI_HEADER: AI_API_KEY}, timeout=30)
    r.raise_for_status()
    return r.json()

def upsert_user(u_idx: int, items, replace=True):
    return _post("/api/reco/admin/upsert/user", {"u_idx": u_idx, "items": items, "replace": replace})

def upsert_day(day: str, items, replace=True):
    return _post("/api/reco/admin/upsert/day", {"day": day, "items": items, "replace": replace})

def upsert_week(iso: str, items, replace=True):
    return _post("/api/reco/admin/upsert/week", {"iso": iso, "items": items, "replace": replace})
