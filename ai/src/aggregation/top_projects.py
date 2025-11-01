import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple

import numpy as np
import pandas as pd
import requests
from sqlalchemy import create_engine, text

# ==== ENV ====
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ai_user:ai_pw@localhost:5252/ai_db")
TZ_NAME      = os.getenv("TZ", "Asia/Seoul")

WORKER_BASE  = os.getenv("WORKER_BASE", "https://api.dnutzs.org")
AI_HEADER    = os.getenv("AI_HEADER", "X-AI-API-Key")
AI_API_KEY   = os.getenv("AI_API_KEY", "test")

STORE_TOPK_TOP = int(os.getenv("STORE_TOPK_TOP", "200"))
EVENT_WEIGHTS  = {k.strip().lower(): float(v) for k, v in
                  (seg.split(":") for seg in os.getenv("EVENT_WEIGHTS", "view:1,like:3,comment:4").split(",") if seg)}
W_BASE    = float(os.getenv("W_BASE", "0.6"))
W_PERIOD  = float(os.getenv("W_PERIOD", "0.35"))
W_RECENCY = float(os.getenv("W_RECENCY", "0.05"))
RECENCY_HALF_LIFE_DAYS = float(os.getenv("RECENCY_HALF_LIFE_DAYS", "14"))

# ==== TZ ====
try:
    import zoneinfo
    TZ = zoneinfo.ZoneInfo(TZ_NAME)
except Exception:
    TZ = timezone(timedelta(hours=9))

# ==== Utils ====
def _detect_col(conn, table: str, candidates: list[str]) -> Optional[str]:
    rows = conn.execute(
        text("""
            SELECT LOWER(column_name)
            FROM information_schema.columns
            WHERE LOWER(table_name)=LOWER(:t)
        """), {"t": table}
    ).fetchall()
    cols = {r[0] for r in rows}
    for c in candidates:
        if c.lower() in cols:
            return c
    return None

def _norm(arr: np.ndarray) -> np.ndarray:
    if arr.size == 0:
        return arr
    mx = float(np.nanmax(arr))
    if mx <= 0.0 or np.isnan(mx):
        return np.zeros_like(arr)
    return arr / mx

def _today_range():
    now = datetime.now(TZ)
    s = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return s, s + timedelta(days=1)

def _thisweek_range():
    now = datetime.now(TZ)
    s = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.isoweekday() - 1)
    return s, s + timedelta(days=7)

def _post_json(path: str, payload: dict):
    url = WORKER_BASE.rstrip("/") + path
    r = requests.post(url, json=payload, headers={AI_HEADER: AI_API_KEY}, timeout=60)
    if r.status_code >= 400:
        raise RuntimeError(f"worker_error status={r.status_code} url={url} body={r.text}")
    return r.json()

# 집계
def _aggregate(engine, s_period: datetime, e_period: datetime) -> pd.DataFrame:
    table = "raw_interactions"
    with engine.connect() as conn:
        proj_col = _detect_col(conn, table, ["project_id","pid","project"])
        user_col = _detect_col(conn, table, ["user_id","viewer_id","uid","user"])
        ts_col   = _detect_col(conn, table, ["created_at","ts","event_time","event_at","timestamp","createdat","time","dt"])
        evt_col  = _detect_col(conn, table, ["event_type","type","event","evt"])
        missing = [n for n,v in {"project_id":proj_col,"user_id":user_col,"timestamp":ts_col,"event_type":evt_col}.items() if v is None]
        if missing:
            raise RuntimeError(f"[top_projects] '{table}' missing columns: {', '.join(missing)}")

        q_all = text(f"""
            SELECT {proj_col} AS project_id, LOWER({evt_col}) AS evt, COUNT(*)::bigint AS cnt
            FROM {table}
            GROUP BY {proj_col}, LOWER({evt_col})
        """)
        df_all = pd.read_sql(q_all, conn)

        q_period = text(f"""
            SELECT {proj_col} AS project_id, LOWER({evt_col}) AS evt, COUNT(*)::bigint AS cnt
            FROM {table}
            WHERE {ts_col} >= :s AND {ts_col} < :e
            GROUP BY {proj_col}, LOWER({evt_col})
        """)
        df_p = pd.read_sql(q_period, conn, params={"s": s_period, "e": e_period})

        q_last = text(f"""
            SELECT {proj_col} AS project_id, MAX({ts_col}) AS last_ts
            FROM {table}
            GROUP BY {proj_col}
        """)
        df_last = pd.read_sql(q_last, conn)

    def weighted_sum(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return pd.DataFrame(columns=["project_id","score"])
        wmap = EVENT_WEIGHTS
        df = df.copy()
        df["w"] = df["evt"].map(lambda k: wmap.get(str(k).lower(), 0.0)).astype(float)
        df["ws"] = df["w"] * df["cnt"].astype(float)
        return df.groupby("project_id", as_index=False)["ws"].sum().rename(columns={"ws":"score"})

    base_df   = weighted_sum(df_all)
    period_df = weighted_sum(df_p)

    if df_last.empty:
        rec_df = pd.DataFrame(columns=["project_id","recency"])
    else:
        now_ts = datetime.now(TZ).timestamp()
        half = max(1.0, RECENCY_HALF_LIFE_DAYS) * 86400.0
        lam = np.log(2.0) / half
        rec_df = df_last.copy()
        rec_df["ts_num"] = pd.to_datetime(rec_df["last_ts"], utc=True).astype("int64") / 1e9
        rec_df["age"] = np.maximum(0.0, now_ts - rec_df["ts_num"])
        rec_df["recency"] = np.exp(-lam * rec_df["age"])
        rec_df = rec_df[["project_id","recency"]]

    keys = set(map(int, base_df.get("project_id", pd.Series([],dtype="int64")).tolist())) \
         | set(map(int, period_df.get("project_id", pd.Series([],dtype="int64")).tolist())) \
         | set(map(int, rec_df.get("project_id", pd.Series([],dtype="int64")).tolist()))
    if not keys:
        return pd.DataFrame(columns=["project_id","base","period","recency","final"])

    out = pd.DataFrame({"project_id": sorted(keys)})
    out = out.merge(base_df.rename(columns={"score":"base"}), on="project_id", how="left")
    out = out.merge(period_df.rename(columns={"score":"period"}), on="project_id", how="left")
    out = out.merge(rec_df, on="project_id", how="left")
    out[["base","period","recency"]] = out[["base","period","recency"]].fillna(0.0).infer_objects(copy=False)

    base_n   = _norm(out["base"].to_numpy(dtype=float))
    period_n = _norm(out["period"].to_numpy(dtype=float))
    rec_n    = _norm(out["recency"].to_numpy(dtype=float))

    out["final"] = (W_BASE * base_n + W_PERIOD * period_n + W_RECENCY * rec_n).astype(float)
    # 동점 미세 분산
    out["final"] = out["final"] + (np.arange(len(out)) % 997) * 1e-12
    return out

def _upsert_top_day(ymd: str, items: List[Tuple[int,float]]):
    return _post_json("/api/reco/admin/upsert/top/day",
                      {"ymd": ymd, "items": [{"project_id": p, "score": s} for p, s in items]})

def _upsert_top_week(week: str, items: List[Tuple[int,float]]):
    # Worker는 week/iso 둘 다 지원하지만, DB 컬럼은 week 이므로 여기서 week로 보냄
    return _post_json("/api/reco/admin/upsert/top/week",
                      {"week": week, "items": [{"project_id": p, "score": s} for p, s in items]})

def run(mode: str):
    ai = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

    if mode == "day":
        s, e = _today_range()
        df = _aggregate(ai, s, e).sort_values(["final","project_id"], ascending=[False, True])
        if STORE_TOPK_TOP > 0: df = df.head(STORE_TOPK_TOP)
        items = [(int(r.project_id), float(r.final)) for r in df.itertuples(index=False)]
        _upsert_top_day(s.strftime("%Y%m%d"), items)

    elif mode == "week":
        s, e = _thisweek_range()
        df = _aggregate(ai, s, e).sort_values(["final","project_id"], ascending=[False, True])
        if STORE_TOPK_TOP > 0: df = df.head(STORE_TOPK_TOP)
        iso_year, iso_week, _ = s.isocalendar()
        week = f"{iso_year}W{iso_week:02d}"
        items = [(int(r.project_id), float(r.final)) for r in df.itertuples(index=False)]
        _upsert_top_week(week, items)

    else:
        raise ValueError("mode must be 'day' or 'week'")


def main():
    print(f"[top_projects] DB={DATABASE_URL} -> {WORKER_BASE} ({AI_HEADER})")
    run("day")
    print("[top_projects] day upsert ok")
    run("week")
    print("[top_projects] week upsert ok")
    print("[top_projects] done")

if __name__ == "__main__":
    main()
