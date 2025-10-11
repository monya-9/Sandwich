# -*- coding: utf-8 -*-
import os, json, math
from typing import List, Tuple
import redis
import requests

API_BASE      = os.getenv("API_BASE", "https://api.dnutzs.org")
AI_API_KEY    = os.getenv("AI_API_KEY", "test")
REDIS_URL     = os.getenv("REDIS_URL", "redis://localhost:4242/0")
MIGRATE_PATTERN = os.getenv("MIGRATE_PATTERN", "recs:*")
BATCH_SIZE    = int(os.getenv("BATCH_SIZE", "500"))
TIMEOUT_S     = int(os.getenv("HTTP_TIMEOUT", "20"))

def _post(path: str, payload: dict) -> dict:
    url = f"{API_BASE}{path}"
    headers = {
        "Content-Type": "application/json",
        "X-AI-API-Key": AI_API_KEY,
    }
    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=TIMEOUT_S)
    if r.status_code >= 400:
        raise RuntimeError(f"worker_error status={r.status_code} url={url} body={r.text}")
    return r.json()

def upsert_user(u_idx: int, items: List[Tuple[int, float]], replace: bool) -> dict:
    payload = {
        "u_idx": int(u_idx),
        "items": [{"project_id": int(pid), "score": float(score)} for pid, score in items],
        "replace": bool(replace),
    }
    return _post("/api/reco/admin/upsert/user", payload)

def migrate_from_redis():
    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    keys = sorted([k for k in r.scan_iter(MIGRATE_PATTERN)])
    print(f"[inference] migrate keys={len(keys)} from {REDIS_URL}")
    for k in keys:
        # 허용 프리픽스: recs:19, recs19, rec:19 등 - 숫자 추출
        tail = k.split(":")[-1]
        try:
            u_idx = int(tail)
        except ValueError:
            print(f" skip key={k} (no integer tail)")
            continue

        pairs = r.zrevrange(k, 0, -1, withscores=True)  # [(member,score)]
        pairs = [(int(member), float(score)) for member, score in pairs]

        if not pairs:
            # 비어있어도 대상을 교체하려면 replace=True로 한번 호출하고 종료 가능
            upsert_user(u_idx, [], replace=True)
            print(f" migrated empty u_idx={u_idx}")
            continue

        # 청크 업서트
        first = True
        for i in range(0, len(pairs), BATCH_SIZE):
            part = pairs[i:i+BATCH_SIZE]
            _ = upsert_user(u_idx, part, replace=(first))
            first = False
        print(f" migrated u_idx={u_idx} n={len(pairs)}")

def main():
    # 인자 없이 실행하면 Redis→D1 마이그레이션
    migrate_from_redis()

if __name__ == "__main__":
    main()
