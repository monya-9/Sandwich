import argparse
import json
from datetime import datetime

import redis

from src.config import REDIS_URL, get_tz

TZ = get_tz()

def today_key():
    now = datetime.now(TZ) if TZ else datetime.now()
    return f"top:day:{now.strftime('%Y%m%d')}"

def week_key():
    now = datetime.now(TZ) if TZ else datetime.now()
    iso_year, iso_week, _ = now.isocalendar()
    return f"top:week:{iso_year}W{iso_week:02d}"

def print_user_recs(r: redis.Redis, u_idx: int, topn: int = 10):
    key = f"recs:{u_idx}"
    rows = r.zrevrange(key, 0, topn-1, withscores=True)
    if not rows:
        print(f"=== u_idx={u_idx} | no recs ==="); return
    try:
        i2u = json.loads(open("data/mappings/users_rev.json","r",encoding="utf-8").read())
        user_id = i2u.get(str(u_idx), f"?({u_idx})")
    except Exception:
        user_id = f"?({u_idx})"
    print(f"=== u_idx={u_idx} (user_id={user_id}) | top={topn} ===")
    for rank, (pid, score) in enumerate(rows, 1):
        print(f"{rank:4d}. project_id={pid:>6}  score={score:.6f}")
    print()

def print_topset(r: redis.Redis, key: str, title: str, topn: int = 5):
    rows = r.zrevrange(key, 0, topn-1, withscores=True)
    print(f"=== {title} | key={key} | top={topn} ===")
    if not rows:
        print("(empty)\n"); return
    for rank, (pid, score) in enumerate(rows, 1):
        print(f"{rank:4d}. project_id={pid:>6}  score={score:.6f}")
    print()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user", type=int, default=None)
    parser.add_argument("--topn", type=int, default=10)
    args = parser.parse_args()

    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    if args.user is not None:
        print_user_recs(r, args.user, topn=args.topn)
    else:
        for u_idx in range(20):
            print_user_recs(r, u_idx, topn=args.topn)

    print_topset(r, today_key(), "DAILY TOP")
    print_topset(r, week_key(),  "WEEKLY TOP")

if __name__ == "__main__":
    main()
