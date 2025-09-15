import hashlib
import json
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import redis
from sqlalchemy import create_engine, text

from src.config import (
    DATABASE_URL, REDIS_URL,
    VIEW_W, LIKE_W, COMMENT_W,
    BLEND_ALPHA_DAILY, BLEND_ALPHA_WEEKLY,
    EWM_ALPHA, TREND_MIN, TREND_MAX,
    TIE_BREAK_EPS_TOP, STORE_TOPK_TOP,
    get_tz,
)

TZ = get_tz()  # None이면 로컬시간 사용

DDL_TOP_TABLE = """
CREATE TABLE IF NOT EXISTS top_projects (
  window_type   VARCHAR(10) NOT NULL,   -- 'day' | 'week'
  window_start  TIMESTAMP   NOT NULL,
  window_end    TIMESTAMP   NOT NULL,
  project_id    BIGINT      NOT NULL,
  rank          INT         NOT NULL,
  final_score   DOUBLE PRECISION NOT NULL,
  meta          JSONB       NULL,
  PRIMARY KEY (window_type, window_start, project_id)
);
"""

def _stable_jitter(pid: int, eps: float) -> float:
    if eps <= 0:
        return 0.0
    h = hashlib.blake2b(str(pid).encode("utf-8"), digest_size=8).digest()
    val = int.from_bytes(h, "big") % 1_000_000
    return eps * (val / 1_000_000.0)

def _now():
    return datetime.now(TZ) if TZ else datetime.now()

def _window_range(kind: str, now=None):
    now = now or _now()
    if kind == "day":
        s = now.replace(hour=0, minute=0, second=0, microsecond=0)
        e = s + timedelta(days=1)
    elif kind == "week":
        weekday = now.weekday()  # Mon=0
        s = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=weekday)
        e = s + timedelta(days=7)
    else:
        raise ValueError("kind must be 'day' or 'week'")
    return s, e

def _buckets_for_history(kind: str, end_exclusive, num_windows=8):
    buckets = []
    step = timedelta(days=1 if kind == "day" else 7)
    e = end_exclusive
    for _ in range(num_windows):
        s = e - step
        buckets.append((s, e))
        e = s
    buckets.reverse()
    return buckets

def _fetch_counts(ai, s, e):
    q_view = text("""
        SELECT project_id, COUNT(DISTINCT viewer_id) AS views
        FROM events_view
        WHERE ts >= :s AND ts < :e
        GROUP BY project_id
    """)
    q_like = text("""
        SELECT project_id, COUNT(DISTINCT user_id) AS likes
        FROM events_like
        WHERE ts >= :s AND ts < :e
        GROUP BY project_id
    """)
    q_comment = text("""
        SELECT project_id, COUNT(*) AS comments
        FROM events_comment
        WHERE ts >= :s AND ts < :e
        GROUP BY project_id
    """)
    dfv = pd.read_sql(q_view, ai, params={"s": s, "e": e})
    dfl = pd.read_sql(q_like, ai, params={"s": s, "e": e})
    dfc = pd.read_sql(q_comment, ai, params={"s": s, "e": e})

    df = dfv.merge(dfl, on="project_id", how="outer").merge(dfc, on="project_id", how="outer")

    # 숫자 컬럼 보장 (FutureWarning 없이)
    for col in ("views", "likes", "comments"):
        if col not in df.columns:
            df[col] = 0
    num_cols = ["views", "likes", "comments"]
    num = df[num_cols].apply(pd.to_numeric, errors="coerce").fillna(0).astype(np.int64)
    df[num_cols] = num

    return df[["project_id", "views", "likes", "comments"]]

def _score_now(df_now: pd.DataFrame, alpha: float):
    if df_now.empty:
        return pd.DataFrame(columns=["project_id","final","raw","eng","trend"])
    df_now = df_now.copy()
    df_now["raw"] = (VIEW_W*df_now["views"].astype(float)
                     + LIKE_W*df_now["likes"].astype(float)
                     + COMMENT_W*df_now["comments"].astype(float))
    eng = np.log1p(df_now["raw"].values)
    p95 = np.percentile(eng, 95) if eng.size > 0 else 1.0
    p95 = p95 if p95 > 0 else 1.0
    norm_eng = np.clip(eng / p95, 0.0, 1.0)

    df_now["eng"] = norm_eng
    df_now["trend"] = 0.0
    df_now["final"] = alpha*df_now["eng"] + (1-alpha)*df_now["trend"]
    return df_now[["project_id","final","raw","eng","trend"]].copy()

def _compute_trend(ai, kind: str, now_s, now_e, df_now_scored: pd.DataFrame, alpha: float):
    past = _buckets_for_history(kind, end_exclusive=now_s, num_windows=8)
    frames = []
    for s,e in past:
        dfp = _fetch_counts(ai, s, e)
        if dfp.empty:
            continue
        dfp = dfp.copy()
        dfp["raw"] = (VIEW_W*dfp["views"].astype(float)
                      + LIKE_W*dfp["likes"].astype(float)
                      + COMMENT_W*dfp["comments"].astype(float))
        dfp["bucket_start"] = s
        frames.append(dfp[["project_id","raw","bucket_start"]])

    if not frames:
        return df_now_scored

    hist = pd.concat(frames, ignore_index=True).sort_values("bucket_start")
    def _ewm_last(s: pd.Series) -> float:
        return float(s.ewm(alpha=EWM_ALPHA, adjust=False).mean().iloc[-1])
    base = (
        hist.groupby("project_id", as_index=False)
            .agg(baseline=("raw", _ewm_last))
    )

    now_raw = df_now_scored[["project_id","raw"]]
    merged = now_raw.merge(base, on="project_id", how="left").fillna({"baseline": 0.0})
    growth = merged["raw"].values / (merged["baseline"].values + 1e-6)
    growth = np.clip(growth, TREND_MIN, TREND_MAX)
    trend = (growth - TREND_MIN) / (TREND_MAX - TREND_MIN)

    out = df_now_scored.copy()
    out["trend"] = trend
    out["final"]  = alpha*out["eng"] + (1-alpha)*out["trend"]
    return out

def _apply_tie_break(df: pd.DataFrame):
    if df.empty or TIE_BREAK_EPS_TOP <= 0:
        return df
    jitters = df["project_id"].apply(lambda x: _stable_jitter(int(x), TIE_BREAK_EPS_TOP)).values
    df = df.copy()
    df["final"] = np.clip(df["final"].values + jitters, 0.0, None)
    return df

def _save(ai, kind: str, s, e, df: pd.DataFrame):
    df = df.sort_values(["final","raw","eng","trend"], ascending=False)
    topk = df.head(STORE_TOPK_TOP)

    # Redis 저장은 동일 ...
    client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    pipe = client.pipeline(transaction=True)
    key = f"top:day:{s.strftime('%Y%m%d')}" if kind == "day" else (
        lambda ys, w: f"top:week:{ys}W{w:02d}"
    )(*s.isocalendar()[:2])
    pipe.delete(key)
    if not topk.empty:
        mapping = {str(int(r.project_id)): float(r.final) for r in topk.itertuples(index=False)}
        pipe.zadd(key, mapping)
    pipe.execute()

    # DB 저장
    from sqlalchemy import text, create_engine
    with ai.begin() as conn:
        conn.execute(text(DDL_TOP_TABLE))
        conn.execute(text("""
            DELETE FROM top_projects
            WHERE window_type=:t AND window_start=:s
        """), {"t": kind, "s": s})

        rows = []
        rank = 1
        for r in topk.itertuples(index=False):
            meta_json = json.dumps({
                "raw": float(r.raw), "eng": float(r.eng), "trend": float(r.trend)
            }, ensure_ascii=False)
            rows.append({
                "t": kind, "s": s, "e": e,
                "pid": int(r.project_id), "rank": rank,
                "score": float(r.final),
                "meta": meta_json,   # 문자열로 바인딩
            })
            rank += 1

        if rows:
            conn.execute(text("""
                INSERT INTO top_projects(
                    window_type, window_start, window_end,
                    project_id, rank, final_score, meta
                )
                VALUES (:t, :s, :e, :pid, :rank, :score, CAST(:meta AS JSONB))
            """), rows)

def run(kind: str):
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    now_s, now_e = _window_range(kind)
    alpha = BLEND_ALPHA_DAILY if kind == "day" else BLEND_ALPHA_WEEKLY

    df_now = _fetch_counts(ai, now_s, now_e)
    df_score = _score_now(df_now, alpha)
    df_score = _compute_trend(ai, kind, now_s, now_e, df_score, alpha)
    df_score = _apply_tie_break(df_score)
    _save(ai, kind, now_s, now_e, df_score)

def main():
    run("day")
    run("week")
    print("✅ top_projects (day & week) computed/saved.")

if __name__ == "__main__":
    main()
