import os
import json
from pathlib import Path
import redis

TOP_N = 10
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:4242/0")

ROOT = Path(__file__).resolve().parents[1]
MAP_DIR = ROOT / "data" / "mappings"

def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

def to_int_safe(x, default=0):
    try:
        return int(x)
    except Exception:
        return default

def to_float_safe(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default

def main():
    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    pairs = []  # (u_idx, total)
    for key in r.scan_iter(match="recs:*", count=1000):
        k = key if isinstance(key, str) else key.decode("utf-8")
        if not k.startswith("recs:"):
            continue
        try:
            u_idx = int(k.split(":", 1)[1])
        except Exception:
            continue
        total = to_int_safe(r.zcard(k), 0)
        pairs.append((u_idx, total))

    if not pairs:
        print("[INFO] recs:* 키가 없습니다. 파이프라인/인퍼런스 실행을 먼저 해주세요.")
        return

    pairs.sort(key=lambda x: x[0])
    rev = load_json(MAP_DIR / "users_rev.json")
    to_user_id = (lambda u: to_int_safe(rev.get(str(u), u))) if rev else (lambda u: u)

    totals = [to_int_safe(t, 0) for _, t in pairs]
    sum_total = sum(totals)
    cnt_users = len(pairs)
    avg = (sum_total / cnt_users) if cnt_users > 0 else 0.0
    min_total = min(totals) if totals else 0
    max_total = max(totals) if totals else 0

    print(
        "[SUMMARY] users_with_recs={} total_items(sum)={} avg={:.2f} min={} max={}\n".format(
            cnt_users, sum_total, float(avg), min_total, max_total
        )
    )

    for u_idx, total in pairs:
        user_id = to_user_id(u_idx)
        key = f"recs:{u_idx}"
        print(f"=== u_idx={u_idx} (user_id={user_id}) | total={total} ===")
        if total == 0:
            print("  (empty)\n")
            continue
        topn = r.zrevrange(key, 0, max(0, TOP_N - 1), withscores=True)
        for rank, (project_id, score) in enumerate(topn, start=1):
            s = to_float_safe(score, 0.0)
            print(f"  {rank:2d}. project_id={project_id}  score={s:.6f}")
        print()

if __name__ == "__main__":
    main()
