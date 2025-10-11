import argparse
import json
from datetime import datetime
import os
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
        with open("data/mappings/users_rev.json","r",encoding="utf-8") as f:
            i2u = json.load(f)
        user_id = i2u.get(str(u_idx), f"?({u_idx})")
    except Exception:
        user_id = f"?({u_idx})"
    print(f"=== u_idx={u_idx} (user_id={user_id}) | top={topn} ===")
    for rank, (pid, score) in enumerate(rows, 1):
        s = float(score) if isinstance(score,(int,float,str)) else 0.0
        print(f"{rank:4d}. project_id={pid:>6}  score={s:.6f}")
    print()

def print_topset(r: redis.Redis, key: str, title: str, topn: int = 5):
    rows = r.zrevrange(key, 0, topn-1, withscores=True)
    print(f"=== {title} | key={key} | top={topn} ===")
    if not rows:
        print("(empty)\n"); return
    for rank, (pid, score) in enumerate(rows, 1):
        s = float(score) if isinstance(score,(int,float,str)) else 0.0
        print(f"{rank:4d}. project_id={pid:>6}  score={s:.6f}")
    print()

def iter_existing_users(r: redis.Redis):
    seen = set()
    for key in r.scan_iter(match="recs:*", count=1000):
        k = key if isinstance(key,str) else key.decode("utf-8")
        if not k.startswith("recs:"):
            continue
        try:
            u_idx = int(k.split(":",1)[1])
            if u_idx not in seen:
                seen.add(u_idx)
                yield u_idx
        except Exception:
            continue

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user", type=int, default=None)
    parser.add_argument("--topn", type=int, default=10)
    args = parser.parse_args()

    # 디버깅용: 현재 접속 대상 표시
    print(f"[INFO] REDIS_URL={REDIS_URL}")

    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    if args.user is not None:
        print_user_recs(r, args.user, topn=args.topn)
    else:
        found_any = False
        for u_idx in sorted(iter_existing_users(r)):
            found_any = True
            print_user_recs(r, u_idx, topn=args.topn)
        if not found_any:
            print("[INFO] recs:* 키가 없습니다. 파이프라인/인퍼런스 실행을 먼저 해주세요.")

    print_topset(r, today_key(), "DAILY TOP")
    print_topset(r, week_key(),  "WEEKLY TOP")

if __name__ == "__main__":
    main()
